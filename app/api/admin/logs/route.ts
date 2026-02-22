import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user?.isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Read logs.txt file
        const logPath = path.join(process.cwd(), "logs.txt");

        let logs: string[] = [];

        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, "utf-8");
            logs = content.split("\n").filter(line => line.trim()).reverse().slice(0, 100);
        }

        return NextResponse.json({ logs });
    } catch (error) {
        console.error("ADMIN_LOGS_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
