import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Folder from "@/models/Folder";
import User from "@/models/User";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { folderId, email, action, password, expiryDays } = await req.json();

        await dbConnect();
        const folder = await Folder.findById(folderId);
        if (!folder) {
            return new NextResponse("Folder not found", { status: 404 });
        }

        // Check ownership
        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser || folder.owner.toString() !== currentUser._id.toString()) {
            return new NextResponse("Not authorized to share this folder", { status: 403 });
        }

        if (action === "share_email") {
            const targetUser = await User.findOne({ email });
            if (!targetUser) {
                return new NextResponse("User not found", { status: 404 });
            }

            // Add to sharedWith array if not already there
            const isShared = folder.sharedWith?.some((s: any) => s.user.toString() === targetUser._id.toString());
            if (!isShared) {
                if (!folder.sharedWith) folder.sharedWith = [];
                folder.sharedWith.push({ user: targetUser._id, permission: 'viewer' });
                await folder.save();
            }

            return NextResponse.json({ success: true });

        } else if (action === "generate_link") {
            // Generate or reuse public token
            if (!folder.publicToken) {
                folder.publicToken = uuidv4();
            }

            // Set password if provided
            if (password) {
                folder.sharePassword = await bcrypt.hash(password, 10);
            } else {
                folder.sharePassword = null;
            }

            // Set expiry
            if (expiryDays && expiryDays > 0) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));
                folder.shareExpiry = expiryDate;
            } else {
                folder.shareExpiry = null;
            }

            await folder.save();

            return NextResponse.json({
                link: `${process.env.NEXTAUTH_URL}/share/folder/${folder.publicToken}`,
                hasPassword: !!password,
                expiresAt: folder.shareExpiry
            });

        } else if (action === "remove_sharing") {
            folder.publicToken = null;
            folder.sharePassword = null;
            folder.shareExpiry = null;
            folder.sharedWith = [];
            await folder.save();

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("FOLDER_SHARE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
