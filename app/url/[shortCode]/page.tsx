import { redirect, notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Url from "@/models/Url";

interface PageProps {
    params: { shortCode: string };
}

export default async function RedirectPage({ params }: PageProps) {
    await dbConnect();

    const url = await Url.findOne({ shortCode: params.shortCode });

    if (!url) {
        notFound();
    }

    // Increment click count
    await Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1 } });

    // Redirect to original URL
    redirect(url.originalUrl);
}
