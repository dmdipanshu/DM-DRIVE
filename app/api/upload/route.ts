import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import File from "@/models/File";
import User from "@/models/User";
import logger from "@/lib/logger";

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * Complete step: receives Google Drive file ID + metadata as JSON,
 * creates the DB record. No file data passes through this route.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { googleFileId, filename, mimeType, size, parent } = await req.json();

        if (!googleFileId || !filename) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const fileSize = parseInt(size || "0", 10);

        // Double-check storage limit
        if (user.storageUsed + fileSize > user.storageLimit) {
            return new NextResponse("Storage limit exceeded", { status: 413 });
        }

        const newFile = await File.create({
            name: filename,
            mimeType: mimeType,
            size: fileSize,
            owner: user._id,
            parent: parent && parent !== "null" ? parent : null,
            googleFileId: googleFileId,
        });

        user.storageUsed += newFile.size;
        await user.save();

        logger.upload(filename, fileSize, true);

        return NextResponse.json(newFile);

    } catch (error: any) {
        logger.error("UPLOAD_COMPLETE_CRASH", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
