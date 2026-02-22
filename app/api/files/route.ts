import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import File from "@/models/File";
import User from "@/models/User";
import logger from "@/lib/logger";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const url = new URL(req.url);
        const parentId = url.searchParams.get("parent");
        const searchQuery = url.searchParams.get("search");
        const starred = url.searchParams.get("starred");
        const recent = url.searchParams.get("recent");

        const query: any = { owner: user._id, isTrash: false };

        if (searchQuery) {
            // SECURITY: Escape regex special characters to prevent ReDoS
            const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.name = { $regex: escapedQuery, $options: 'i' };
        } else if (starred === 'true') {
            query.isStarred = true;
        } else if (recent === 'true') {
            // Recent: no parent filter, just sort by date (handled below)
        } else {
            // Normal navigation: Filter by parent
            const queryParent = parentId === "root" || parentId === "null" || !parentId ? null : parentId;
            query.parent = queryParent;
        }

        const files = await File.find(query).sort({ createdAt: -1 }).lean();

        return NextResponse.json(files);
    } catch (error) {
        logger.error("FILES_GET_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
