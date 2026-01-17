import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/db";
import Url from "@/models/Url";
import User from "@/models/User";

// Delete a URL
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const url = await Url.findById(params.id);
        if (!url) {
            return new NextResponse("URL not found", { status: 404 });
        }

        // Check ownership
        if (url.owner?.toString() !== user._id.toString()) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await Url.findByIdAndDelete(params.id);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("URL_DELETE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// Get URL stats
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const url = await Url.findById(params.id);

        if (!url) {
            return new NextResponse("URL not found", { status: 404 });
        }

        return NextResponse.json(url);

    } catch (error) {
        console.error("URL_GET_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
