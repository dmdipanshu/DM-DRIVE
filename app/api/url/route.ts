import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Url from "@/models/Url";
import User from "@/models/User";
import { nanoid } from "nanoid";

// Generate short code
function generateShortCode(): string {
    return nanoid(7); // 7 character short code
}

// Create a new short URL
export async function POST(req: Request) {
    try {
        const { originalUrl } = await req.json();

        if (!originalUrl) {
            return new NextResponse("URL is required", { status: 400 });
        }

        // Validate URL
        try {
            new URL(originalUrl);
        } catch {
            return new NextResponse("Invalid URL format", { status: 400 });
        }

        await dbConnect();

        // Get user if logged in (optional)
        const session = await getServerSession();
        let userId = null;
        if (session?.user?.email) {
            const user = await User.findOne({ email: session.user.email });
            userId = user?._id;
        }

        // Generate unique short code
        let shortCode = generateShortCode();
        let attempts = 0;
        while (await Url.findOne({ shortCode }) && attempts < 5) {
            shortCode = generateShortCode();
            attempts++;
        }

        const url = await Url.create({
            shortCode,
            originalUrl,
            owner: userId
        });

        return NextResponse.json({
            shortCode: url.shortCode,
            shortUrl: `${process.env.NEXTAUTH_URL}/url/${url.shortCode}`,
            originalUrl: url.originalUrl
        });

    } catch (error) {
        console.error("URL_CREATE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// Get user's URLs
export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json([]); // Return empty for anonymous
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json([]);
        }

        const urls = await Url.find({ owner: user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json(urls);

    } catch (error) {
        console.error("URL_GET_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
