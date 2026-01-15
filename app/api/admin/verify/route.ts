import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ isAdmin: false });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });

        return NextResponse.json({ isAdmin: user?.isAdmin || false });
    } catch (error) {
        return NextResponse.json({ isAdmin: false });
    }
}
