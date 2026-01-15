"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Star, File as FileIcon } from "lucide-react";

export default function StarredPage() {
    const { status } = useSession();
    const router = useRouter();
    const [files, setFiles] = useState<any[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        else if (status === "authenticated") fetchStarred();
    }, [status]);

    const fetchStarred = async () => {
        try {
            // Re-using files endpoint? We need a filter.
            // Let's assume we modify GET /api/files to support ?starred=true
            // or we filter client side? Client side is easier for MVP but bad for scale.
            // Let's modify API to be robust. 
            // WAIT: I didn't modify GET /api/files to support 'starred' yet.
            // I should stick to adding support in API or new endpoint.
            // Let's try calling with a transparent param and I'll update API in next step if needed.
            // Actually, I can just filter the getAll response if I trust it, but better to filter server side.
            // Let's use a new params convention: type=starred
            const res = await axios.get("/api/files?starred=true");
            setFiles(res.data);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="p-8 bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-amber-500">
                <Star className="w-6 h-6 fill-current" /> Starred
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((file) => (
                    <div key={file._id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                                <FileIcon className="w-6 h-6 text-blue-500" />
                            </div>
                            <span className="truncate font-medium">{file.name}</span>
                        </div>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                ))}
                {files.length === 0 && <p className="text-gray-500">No starred files.</p>}
            </div>

            <button onClick={() => router.push("/dashboard")} className="mt-8 text-blue-600 hover:underline">
                Back to Drive
            </button>
        </div>
    );
}
