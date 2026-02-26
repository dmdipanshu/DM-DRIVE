import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import logger from "@/lib/logger";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Step 2: Proxy a single chunk to Google Drive's resumable upload endpoint.
 * The client sends each file chunk (< 4MB) as the raw body, with metadata in headers.
 * This keeps each request well under Vercel's 4.5MB limit.
 */
export async function PUT(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get upload metadata from headers
        const uploadUrl = req.headers.get("x-upload-url");
        const accessToken = req.headers.get("x-access-token");
        const contentRange = req.headers.get("content-range");
        const contentType = req.headers.get("content-type") || "application/octet-stream";

        if (!uploadUrl || !accessToken) {
            return new NextResponse("Missing upload URL or access token", { status: 400 });
        }

        // Read the chunk body
        const chunkBuffer = await req.arrayBuffer();

        // Forward the chunk to Google Drive's resumable upload endpoint
        const headers: Record<string, string> = {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": contentType,
            "Content-Length": chunkBuffer.byteLength.toString(),
        };

        if (contentRange) {
            headers["Content-Range"] = contentRange;
        }

        const driveRes = await fetch(uploadUrl, {
            method: "PUT",
            headers,
            body: chunkBuffer,
        });

        // 308 Resume Incomplete = chunk received, more expected
        // 200/201 = upload complete
        if (driveRes.status === 308) {
            const range = driveRes.headers.get("Range");
            return NextResponse.json({ status: "incomplete", range }, { status: 200 });
        }

        if (driveRes.ok) {
            const data = await driveRes.json();
            return NextResponse.json({ status: "complete", fileId: data.id, data });
        }

        const errText = await driveRes.text();
        logger.error("UPLOAD_CHUNK_DRIVE_ERROR", { status: driveRes.status, body: errText });
        return new NextResponse(`Drive error: ${driveRes.status} ${errText}`, { status: 502 });

    } catch (error: any) {
        logger.error("UPLOAD_CHUNK_CRASH", error);
        return new NextResponse(error.message, { status: 500 });
    }
}
