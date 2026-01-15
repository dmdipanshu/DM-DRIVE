import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import File from "@/models/File";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user?.isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Gather stats
        const totalUsers = await User.countDocuments();
        const totalFiles = await File.countDocuments({ isTrash: false });

        const storageAgg = await User.aggregate([
            { $group: { _id: null, total: { $sum: "$storageUsed" } } }
        ]);
        const totalStorage = storageAgg[0]?.total || 0;

        // Active today - users who have files uploaded today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeToday = await File.distinct("owner", { createdAt: { $gte: today } });

        return NextResponse.json({
            totalUsers,
            totalFiles,
            totalStorage,
            activeToday: activeToday.length
        });
    } catch (error) {
        console.error("ADMIN_STATS_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
