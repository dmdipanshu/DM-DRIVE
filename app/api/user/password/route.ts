import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function PUT(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return new NextResponse("Both passwords required", { status: 400 });
        }

        if (newPassword.length < 6) {
            return new NextResponse("Password must be at least 6 characters", { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email }).select("+password");

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return new NextResponse("Current password is incorrect", { status: 400 });
        }

        // Hash new password and save
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PASSWORD_UPDATE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
