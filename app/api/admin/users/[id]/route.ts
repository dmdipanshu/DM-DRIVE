import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import File from "@/models/File";
import Folder from "@/models/Folder";
import { deleteFromDrive } from "@/lib/google-drive";

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

        const { isAdmin, storageLimit } = await req.json();

        const updateData: any = {};
        if (typeof isAdmin === "boolean") updateData.isAdmin = isAdmin;
        if (typeof storageLimit === "number") updateData.storageLimit = storageLimit;

        await User.findByIdAndUpdate(params.id, updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("ADMIN_USER_UPDATE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

        // Prevent self-deletion
        if (currentUser._id.toString() === params.id) {
            return new NextResponse("Cannot delete your own account", { status: 400 });
        }

        // Delete user's files from Google Drive
        const files = await File.find({ owner: params.id });
        for (const file of files) {
            if (file.googleFileId) {
                try {
                    await deleteFromDrive(file.googleFileId);
                } catch (e) {
                    console.error("Failed to delete file from Drive:", e);
                }
            }
        }

        // Delete all user data
        await File.deleteMany({ owner: params.id });
        await Folder.deleteMany({ owner: params.id });
        await User.findByIdAndDelete(params.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("ADMIN_USER_DELETE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
