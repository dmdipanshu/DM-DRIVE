import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Folder from "@/models/Folder";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

        const { name, parent } = await req.json();

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return new NextResponse("User not found", { status: 404 });

        const folder = await Folder.create({
            name,
            owner: user._id,
            parent: parent || null
        });

        return NextResponse.json(folder);
    } catch (error) {
        console.error("FOLDER_CREATE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

        const url = new URL(req.url);
        const parentId = url.searchParams.get("parent") || null;

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return new NextResponse("User not found", { status: 404 });

        // Fetch folders in this parent directory
        // Note: We need to handle 'null' specifically if passing string "null" from generic fetch, 
        // but here we expect actual null or ID.
        const queryParent = parentId === "root" || parentId === "" ? null : parentId;

        const folders = await Folder.find({
            owner: user._id,
            parent: queryParent,
            isTrash: false
        });

        return NextResponse.json(folders);
    } catch (error) {
        console.error("FOLDER_GET_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
