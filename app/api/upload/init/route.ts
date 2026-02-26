import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import logger from "@/lib/logger";
import { initResumableUpload } from "@/lib/google-drive";

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { filename, mimeType, size } = await req.json();

        if (!filename || !mimeType || !size) {
            return new NextResponse("Missing file metadata", { status: 400 });
        }

        const fileSize = parseInt(size, 10);

        // Check storage limit BEFORE initiating upload
        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        if (user.storageUsed + fileSize > user.storageLimit) {
            return new NextResponse("Storage limit exceeded", { status: 413 });
        }

        logger.info(`UPLOAD_INIT: ${filename} (${fileSize} bytes)`, { user: session.user.email });

        // Get a resumable upload URL from Google Drive
        const { uploadUrl, accessToken } = await initResumableUpload(filename, mimeType, fileSize);

        return NextResponse.json({ uploadUrl, accessToken });

    } catch (error: any) {
        logger.error("UPLOAD_INIT_CRASH", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
