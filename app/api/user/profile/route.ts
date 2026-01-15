import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import File from "@/models/File";
import Folder from "@/models/Folder";
import { deleteFromDrive } from "@/lib/google-drive";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email })
            .select("name email storageUsed storageLimit isAdmin createdAt image");

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("PROFILE_GET_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { name } = await req.json();

        if (!name || name.trim().length < 2) {
            return new NextResponse("Name must be at least 2 characters", { status: 400 });
        }

        await dbConnect();
        await User.findOneAndUpdate(
            { email: session.user.email },
            { name: name.trim() }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PROFILE_UPDATE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        // Delete all user's files from Google Drive
        const files = await File.find({ owner: user._id });
        for (const file of files) {
            if (file.googleFileId) {
                try {
                    await deleteFromDrive(file.googleFileId);
                } catch (e) {
                    console.error("Failed to delete from Drive:", e);
                }
            }
        }

        // Delete all user data
        await File.deleteMany({ owner: user._id });
        await Folder.deleteMany({ owner: user._id });
        await User.findByIdAndDelete(user._id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("PROFILE_DELETE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
