import { redirect, notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Url from "@/models/Url";

interface PageProps {
    params: { shortCode: string };
}

export default async function RedirectPage({ params }: PageProps) {
    await dbConnect();

    // Use findOneAndUpdate to fetch the original URL and increment clicks in a single atomic DB operation.
    // This halves the database round trips, significantly improving the backend redirect speed.
    const url = await Url.findOneAndUpdate(
        { shortCode: params.shortCode },
        { $inc: { clicks: 1 } },
        { select: 'originalUrl', lean: true }
    );

    if (!url) {
        notFound();
    }

    // Redirect to original URL
    redirect(url.originalUrl);
}
