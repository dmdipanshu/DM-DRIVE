import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        await dbConnect();

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return new NextResponse("Email already exists", { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("REGISTRATION_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
