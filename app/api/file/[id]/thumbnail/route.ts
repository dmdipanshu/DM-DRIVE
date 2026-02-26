import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import File from "@/models/File";
import User from "@/models/User";
import { getDriveAccessToken } from "@/lib/google-drive";

export const dynamic = 'force-dynamic';

// --- GET: Get file thumbnail/preview image ---
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

        // Check if it's an image
        if (!file.mimeType?.startsWith("image/")) {
            return new NextResponse("Not an image file", { status: 400 });
        }

        // Get access token
        const driveToken = await getDriveAccessToken();
        if (!driveToken) {
            return new NextResponse("Storage credentials not configured", { status: 503 });
        }

        // Parse size parameter (default to 400 for thumbnails)
        const url = new URL(req.url);
        const size = url.searchParams.get("size") || "400";

        // Try to get thumbnail from Google Drive
        // For images, we can use the thumbnailLink from file metadata or fetch the file directly
        const metadataResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.googleFileId}?fields=thumbnailLink,webContentLink`,
            {
                headers: { 'Authorization': `Bearer ${driveToken}` }
            }
        );

        if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();

            // If thumbnail exists, fetch it with authentication
            if (metadata.thumbnailLink) {
                // Replace size in thumbnail URL
                const thumbnailUrl = metadata.thumbnailLink.replace(/=s\d+/, `=s${size}`);

                const thumbnailResponse = await fetch(thumbnailUrl, {
                    headers: { 'Authorization': `Bearer ${driveToken}` }
                });

                if (thumbnailResponse.ok) {
                    const headers = new Headers();
                    headers.set("Content-Type", thumbnailResponse.headers.get("Content-Type") || "image/jpeg");
                    headers.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
                    if (thumbnailResponse.headers.get("content-length")) {
                        headers.set("Content-Length", thumbnailResponse.headers.get("content-length")!);
                    }

                    // Stream instead of buffering to avoid Vercel's 4.5MB payload limit
                    return new NextResponse(thumbnailResponse.body, { status: 200, headers });
                }
            }
        }

        // Fallback: stream the actual image file
        const driveResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.googleFileId}?alt=media`,
            {
                headers: { 'Authorization': `Bearer ${driveToken}` }
            }
        );

        if (!driveResponse.ok) {
            console.error("Drive thumbnail failed:", driveResponse.status);
            return new NextResponse("Failed to fetch thumbnail from storage", { status: 502 });
        }

        const headers = new Headers();
        headers.set("Content-Type", file.mimeType);
        headers.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
        if (driveResponse.headers.get("content-length")) {
            headers.set("Content-Length", driveResponse.headers.get("content-length")!);
        }

        // Stream instead of buffering to avoid Vercel's 4.5MB payload limit
        return new NextResponse(driveResponse.body, { status: 200, headers });

    } catch (error) {
        console.error("THUMBNAIL_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
