import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await dbConnect();
        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser?.isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const users = await User.find({})
            .select("name email storageUsed storageLimit isAdmin createdAt")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(users);
    } catch (error) {
        console.error("ADMIN_USERS_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
