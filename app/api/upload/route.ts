import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import File from "@/models/File";
import User from "@/models/User";
import { Readable } from 'stream';
import logger from "@/lib/logger";
import { uploadToDrive } from "@/lib/google-drive";

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get Metadata from Query Params (since Body is pure file)
        const url = new URL(req.url);
        const filename = url.searchParams.get("filename");
        const mimeType = url.searchParams.get("type");
        const sizeStr = url.searchParams.get("size");
        const parentId = url.searchParams.get("parent");

        if (!filename || !mimeType || !req.body) {
            return new NextResponse("Missing file data", { status: 400 });
        }

        logger.info(`UPLOAD: Starting ${filename} (${sizeStr} bytes)`, { user: session.user.email });

        // SECURITY: Check storage limit BEFORE uploading
        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const fileSize = parseInt(sizeStr || "0", 10);
        if (user.storageUsed + fileSize > user.storageLimit) {
            return new NextResponse("Storage limit exceeded", { status: 413 });
        }

        // Convert Web Stream (req.body) to Node Stream
        // @ts-ignore
        const nodeStream = Readable.fromWeb(req.body);

        // Upload to Drive
        let googleFile;

        try {
            googleFile = await uploadToDrive(nodeStream, filename, mimeType);
            logger.upload(filename, fileSize, true);
        } catch (err: any) {
            logger.upload(filename, fileSize, false, err.message);
            return new NextResponse(`Drive Error: ${err.message}`, { status: 502 });
        }

        if (!googleFile || !googleFile.id) {
            return new NextResponse("Drive did not return ID", { status: 502 });
        }

        const newFile = await File.create({
            name: filename,
            mimeType: mimeType,
            size: parseInt(sizeStr || "0", 10),
            owner: user._id,
            parent: parentId && parentId !== "null" ? parentId : null,
            googleFileId: googleFile.id,
        });

        user.storageUsed += newFile.size;
        await user.save();

        return NextResponse.json(newFile);

    } catch (error: any) {
        logger.error("UPLOAD_CRASH", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
