import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Folder from "@/models/Folder";
import File from "@/models/File";
import bcrypt from "bcryptjs";
import { getDriveAccessToken } from "@/lib/google-drive";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const token = url.searchParams.get("token");
        const fileId = url.searchParams.get("fileId");
        const password = url.searchParams.get("password");

        if (!token || !fileId) {
            return new NextResponse("Token and fileId required", { status: 400 });
        }

        await dbConnect();

        // Find the shared folder
        const folder = await Folder.findOne({ publicToken: token });
        if (!folder) {
            return new NextResponse("Folder not found", { status: 404 });
        }

        // Check expiration
        if (folder.shareExpiry && new Date() > folder.shareExpiry) {
            return new NextResponse("Link has expired", { status: 410 });
        }

        // Check password
        if (folder.sharePassword) {
            if (!password) {
                return new NextResponse("Password required", { status: 401 });
            }
            const isMatch = await bcrypt.compare(password, folder.sharePassword);
            if (!isMatch) {
                return new NextResponse("Incorrect password", { status: 401 });
            }
        }

        // Find the file
        const file = await File.findById(fileId);
        if (!file) {
            return new NextResponse("File not found", { status: 404 });
        }

        // SECURITY: Verify the file is actually inside the shared folder tree
        // by walking up the parent chain from the file's parent folder
        let checkFolderId = file.parent;
        let isWithinSharedFolder = false;
        const maxDepth = 50;
        let depth = 0;

        // If file is directly in the shared folder
        if (!checkFolderId) {
            isWithinSharedFolder = false;
        } else {
            while (checkFolderId && depth < maxDepth) {
                if (checkFolderId.toString() === folder._id.toString()) {
                    isWithinSharedFolder = true;
                    break;
                }
                const parentFolder = await Folder.findById(checkFolderId);
                if (!parentFolder) break;
                checkFolderId = parentFolder.parent;
                depth++;
            }
        }

        // Also check if file is directly in the shared folder (parent matches shared folder)
        if (file.parent && file.parent.toString() === folder._id.toString()) {
            isWithinSharedFolder = true;
        }

        if (!isWithinSharedFolder) {
            return new NextResponse("Access denied", { status: 403 });
        }

        // Download the file
        if (file.googleFileId) {
            const driveToken = await getDriveAccessToken();

            if (!driveToken) {
                return new NextResponse("Storage credentials not configured", { status: 503 });
            }

            // Check if worker URL is configured
            let workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;

            if (workerUrl) {
                if (!workerUrl.startsWith("http")) {
                    workerUrl = `https://${workerUrl}`;
                }

                const secret = process.env.WORKER_SECRET || "DM123456789dm+";
                const payload = JSON.stringify({
                    exp: Date.now() + 3600000,
                    fid: file.googleFileId
                });
                const workerToken = `${btoa(payload)}.${secret}`;

                const downloadUrl = `${workerUrl}/${file.googleFileId}?token=${encodeURIComponent(workerToken)}&dt=${encodeURIComponent(driveToken)}&name=${encodeURIComponent(file.name)}`;
                return NextResponse.redirect(downloadUrl);
            }

            // Fallback: Direct Google Drive API download
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${file.googleFileId}?alt=media`,
                {
                    headers: {
                        'Authorization': `Bearer ${driveToken}`,
                    },
                }
            );

            if (!response.ok) {
                console.error("Drive download failed:", response.status);
                return new NextResponse("Failed to fetch file from storage", { status: 502 });
            }

            const headers = new Headers();
            headers.set('Content-Type', file.mimeType || 'application/octet-stream');
            headers.set('Content-Disposition', `attachment; filename="${file.name}"`);
            const fileBuffer = await response.arrayBuffer();
            headers.set('Content-Length', fileBuffer.byteLength.toString());

            return new NextResponse(fileBuffer, {
                status: 200,
                headers,
            });
        }

        // Fallback to internal file endpoint
        return NextResponse.redirect(new URL(`/api/file/${file._id}`, req.url));

    } catch (error) {
        console.error("FOLDER_SHARE_DOWNLOAD_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
