import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import File from "@/models/File";
import bcrypt from "bcryptjs";
import { getDriveAccessToken } from "@/lib/google-drive";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const token = url.searchParams.get("token");
        const password = url.searchParams.get("password");

        if (!token) {
            return new NextResponse("Token required", { status: 400 });
        }

        await dbConnect();
        const file = await File.findOne({ publicToken: token });

        if (!file) {
            return new NextResponse("File not found", { status: 404 });
        }

        // Check expiration
        if (file.shareExpiry && new Date() > file.shareExpiry) {
            return new NextResponse("Link has expired", { status: 410 });
        }

        // Check password
        if (file.sharePassword) {
            if (!password) {
                return new NextResponse("Password required", { status: 401 });
            }
            const isMatch = await bcrypt.compare(password, file.sharePassword);
            if (!isMatch) {
                return new NextResponse("Incorrect password", { status: 401 });
            }
        }

        // Use authenticated download via worker or direct API
        if (file.googleFileId) {
            const driveToken = await getDriveAccessToken();

            if (!driveToken) {
                return new NextResponse("Storage credentials not configured", { status: 503 });
            }

            // Check if worker URL is configured
            let workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;

            if (workerUrl) {
                // Use Cloudflare Worker for download
                if (!workerUrl.startsWith("http")) {
                    workerUrl = `https://${workerUrl}`;
                }

                // Generate access token for worker
                const secret = process.env.WORKER_SECRET || "DM123456789dm+";
                const payload = JSON.stringify({
                    exp: Date.now() + 3600000, // 1 hour
                    fid: file.googleFileId
                });
                const workerToken = `${btoa(payload)}.${secret}`;

                const downloadUrl = `${workerUrl}/${file.googleFileId}?token=${encodeURIComponent(workerToken)}&dt=${encodeURIComponent(driveToken)}&name=${encodeURIComponent(file.name)}`;
                return NextResponse.redirect(downloadUrl);
            }

            // Fallback: Direct Google Drive API download (proxy through our server)
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

            // Stream the response
            const headers = new Headers();
            headers.set('Content-Type', file.mimeType || 'application/octet-stream');
            headers.set('Content-Disposition', `attachment; filename="${file.name}"`);
            // Read as ArrayBuffer to avoid body lock issues
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
        console.error("SHARE_DOWNLOAD_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
