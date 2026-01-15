import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return new NextResponse("User not found", { status: 404 });

        return NextResponse.json({
            storageUsed: user.storageUsed,
            storageLimit: user.storageLimit
        });
    } catch (error) {
        console.error("STATS_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
