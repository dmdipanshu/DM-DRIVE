import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import File from "@/models/File";
import Folder from "@/models/Folder";
import User from "@/models/User";
import { deleteFromDrive } from "@/lib/google-drive";

// Helper: Recursively delete all contents of a folder
async function deleteFolderContents(folderId: string, ownerId: any, user: any) {
    // Delete all files in this folder
    const files = await File.find({ parent: folderId, owner: ownerId });
    for (const file of files) {
        if (file.googleFileId) {
            try {
                await deleteFromDrive(file.googleFileId);
            } catch (e) {
                console.error("Failed to delete from Drive:", file.googleFileId);
            }
        }
        user.storageUsed = Math.max(0, user.storageUsed - file.size);
    }
    await File.deleteMany({ parent: folderId, owner: ownerId });

    // Recursively delete subfolders
    const subfolders = await Folder.find({ parent: folderId, owner: ownerId });
    for (const subfolder of subfolders) {
        await deleteFolderContents(subfolder._id, ownerId, user);
        await Folder.findByIdAndDelete(subfolder._id);
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const files = await File.find({ owner: user._id, isTrash: true });
        const folders = await Folder.find({ owner: user._id, isTrash: true });

        return NextResponse.json([...folders, ...files]);
    } catch (error) {
        console.error("TRASH_GET_ERROR", error);
        return new NextResponse("Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return new NextResponse("ID required", { status: 400 });

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return new NextResponse("User not found", { status: 404 });

        // Try delete file
        const file = await File.findById(id);
        if (file) {
            // Verify ownership
            if (file.owner.toString() !== user._id.toString()) {
                return new NextResponse("Forbidden", { status: 403 });
            }

            // Delete from Google Drive first
            if (file.googleFileId) {
                try {
                    await deleteFromDrive(file.googleFileId);
                } catch (driveError) {
                    console.error("DRIVE_DELETE_ERROR", driveError);
                    // Continue with DB delete even if Drive fails
                }
            }

            // Update user storage
            user.storageUsed = Math.max(0, user.storageUsed - file.size);
            await user.save();

            await File.findByIdAndDelete(id);
        } else {
            // Try folder
            const folder = await Folder.findById(id);
            if (folder && folder.owner.toString() === user._id.toString()) {
                // Recursively delete folder contents
                await deleteFolderContents(id, user._id, user);
                await user.save();
                await Folder.findByIdAndDelete(id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("TRASH_DELETE_ERROR", error);
        return new NextResponse("Error", { status: 500 });
    }
}
