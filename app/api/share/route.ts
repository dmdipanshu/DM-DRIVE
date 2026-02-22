import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import File from "@/models/File";
import User from "@/models/User";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

        const { fileId, email, action, password, expiryDays } = await req.json();

        await dbConnect();
        const file = await File.findById(fileId);
        if (!file) return new NextResponse("File not found", { status: 404 });

        // Check ownership
        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser || file.owner.toString() !== currentUser._id.toString()) {
            return new NextResponse("Not authorized to share this file", { status: 403 });
        }

        if (action === "share_email") {
            const targetUser = await User.findOne({ email });
            if (!targetUser) return new NextResponse("User not found", { status: 404 });

            const isShared = file.sharedWith.some((s: any) => s.user.toString() === targetUser._id.toString());
            if (!isShared) {
                file.sharedWith.push({ user: targetUser._id, permission: 'viewer' });
                await file.save();
            }
        } else if (action === "generate_link") {
            if (!file.publicToken) {
                file.publicToken = uuidv4();
            }

            // Set password if provided
            if (password) {
                file.sharePassword = await bcrypt.hash(password, 10);
            } else {
                file.sharePassword = null;
            }

            // Set expiry if provided (supports fractional days for hours)
            if (expiryDays && expiryDays > 0) {
                const expiryDate = new Date();
                const millisecondsToAdd = parseFloat(expiryDays) * 24 * 60 * 60 * 1000;
                expiryDate.setTime(expiryDate.getTime() + millisecondsToAdd);
                file.shareExpiry = expiryDate;
            } else {
                file.shareExpiry = null;
            }

            await file.save();

            return NextResponse.json({
                link: `${process.env.NEXTAUTH_URL}/share/${file.publicToken}`,
                hasPassword: !!password,
                expiresAt: file.shareExpiry
            });
        } else if (action === "remove_protection") {
            file.sharePassword = null;
            file.shareExpiry = null;
            await file.save();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("SHARE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
