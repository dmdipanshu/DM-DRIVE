import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import File from "@/models/File";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token) {
            return new NextResponse("Token required", { status: 400 });
        }

        await dbConnect();
        const file = await File.findOne({ publicToken: token });

        if (!file) {
            return NextResponse.json({ valid: false, error: "File not found" });
        }

        // Check expiration
        if (file.shareExpiry && new Date() > file.shareExpiry) {
            return NextResponse.json({ valid: false, error: "Link has expired" });
        }

        // Check password
        if (file.sharePassword) {
            if (!password) {
                return NextResponse.json({
                    valid: false,
                    requiresPassword: true,
                    error: "Password required"
                });
            }

            const isMatch = await bcrypt.compare(password, file.sharePassword);
            if (!isMatch) {
                return NextResponse.json({ valid: false, error: "Incorrect password" });
            }
        }

        // All checks passed
        return NextResponse.json({
            valid: true,
            file: {
                id: file._id,
                name: file.name,
                size: file.size,
                mimeType: file.mimeType
            }
        });

    } catch (error) {
        console.error("VERIFY_SHARE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
