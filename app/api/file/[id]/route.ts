import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import File from "@/models/File";
import User from "@/models/User";
import logger from "@/lib/logger";
import { getDriveAccessToken } from "@/lib/google-drive";

export const dynamic = 'force-dynamic';

// --- HEAD: Check File Support (Accelerators) ---
export async function HEAD(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const file = await File.findById(params.id);
        if (!file) return new NextResponse("Not found", { status: 404 });

        // Check ownership or shared access
        if (file.owner.toString() !== user._id.toString()) {
            const isShared = file.sharedWith?.some((s: any) => s.user.toString() === user._id.toString());
            if (!isShared) return new NextResponse("Forbidden", { status: 403 });
        }

        const headers = new Headers();
        headers.set("Content-Type", file.mimeType);
        headers.set("Content-Length", file.size.toString());
        headers.set("Accept-Ranges", "bytes");
        headers.set("Content-Disposition", `attachment; filename="${file.name}"`);

        return new NextResponse(null, { status: 200, headers });
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// --- GET: Download File ---
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const file = await File.findById(params.id);
        if (!file) return new NextResponse("File not found", { status: 404 });

        // Check ownership or shared access
        if (file.owner.toString() !== user._id.toString()) {
            const isShared = file.sharedWith?.some((s: any) => s.user.toString() === user._id.toString());
            if (!isShared) return new NextResponse("Forbidden", { status: 403 });
        }

        // Check if file has Google Drive ID
        if (!file.googleFileId) {
            return new NextResponse("File storage not found", { status: 500 });
        }

        // Log download
        logger.download(file.name, session.user.email || undefined);

        const headers = new Headers();
        headers.set("Content-Disposition", `attachment; filename="${file.name}"`);
        headers.set("Content-Type", file.mimeType || "application/octet-stream");
        headers.set("Accept-Ranges", "bytes");

        // Get access token
        const driveToken = await getDriveAccessToken();
        if (!driveToken) {
            return new NextResponse("Storage credentials not configured", { status: 503 });
        }

        // Check if Cloudflare Worker is configured
        let workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
        if (workerUrl && workerUrl !== "https://your-worker.workers.dev") {
            if (!workerUrl.startsWith("http")) {
                workerUrl = `https://${workerUrl}`;
            }

            // Generate token for worker
            const secret = process.env.WORKER_SECRET || "DM123456789dm+";
            const payload = JSON.stringify({
                exp: Date.now() + 3600000,
                fid: file.googleFileId
            });
            const token = `${btoa(payload)}.${secret}`;

            const redirectUrl = `${workerUrl}/${file.googleFileId}?token=${encodeURIComponent(token)}&dt=${encodeURIComponent(driveToken)}&name=${encodeURIComponent(file.name)}`;
            return NextResponse.redirect(redirectUrl);
        }

        // Direct Google Drive download (no worker)
        const driveResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.googleFileId}?alt=media`,
            {
                headers: { 'Authorization': `Bearer ${driveToken}` }
            }
        );

        if (!driveResponse.ok) {
            console.error("Drive download failed:", driveResponse.status);
            return new NextResponse("Failed to fetch file from storage", { status: 502 });
        }

        // Read as ArrayBuffer to avoid body lock issues
        const fileBuffer = await driveResponse.arrayBuffer();
        headers.set('Content-Length', fileBuffer.byteLength.toString());

        return new NextResponse(fileBuffer, { status: 200, headers });

    } catch (error) {
        console.error("DOWNLOAD_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// --- PUT: Update File ---
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const file = await File.findById(params.id);
        if (!file) return new NextResponse("File not found", { status: 404 });

        // Check ownership
        if (file.owner.toString() !== user._id.toString()) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { name, parent, isTrash, isStarred } = await req.json();

        // Update fields
        if (name !== undefined) file.name = name;
        if (parent !== undefined) file.parent = parent;
        if (isTrash !== undefined) file.isTrash = isTrash;
        if (isStarred !== undefined) file.isStarred = isStarred;

        await file.save();

        return NextResponse.json({ success: true, file });
    } catch (error) {
        console.error("FILE_UPDATE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
