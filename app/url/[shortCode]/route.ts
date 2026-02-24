import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Url from "@/models/Url";

// Prevent static generation — this must be dynamic
export const dynamic = 'force-dynamic';
// Run on Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';

export async function GET(
    request: Request,
    { params }: { params: { shortCode: string } }
) {
    const { shortCode } = params;

    try {
        await dbConnect();

        // Ultra-lean query: only fetch the originalUrl field, skip Mongoose hydration
        const url = await Url.findOne(
            { shortCode },
            { originalUrl: 1 }
        ).lean() as { _id: unknown; originalUrl?: string } | null;

        if (!url || !url.originalUrl) {
            return new NextResponse("Short URL not found", { status: 404 });
        }

        // Fire-and-forget: increment clicks without blocking the redirect
        Url.updateOne(
            { shortCode },
            { $inc: { clicks: 1 } }
        ).exec().catch(() => { });

        // Return instant 301 redirect with caching headers
        return NextResponse.redirect(url.originalUrl, {
            status: 301,
            headers: {
                "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
                "X-Robots-Tag": "noindex",
            },
        });
    } catch (error) {
        console.error("REDIRECT_ERROR:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
