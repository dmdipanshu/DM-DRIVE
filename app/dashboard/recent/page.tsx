"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Clock, File as FileIcon } from "lucide-react";

export default function RecentPage() {
    const { status } = useSession();
    const router = useRouter();
    const [files, setFiles] = useState<any[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        else if (status === "authenticated") fetchRecent();
    }, [status]);

    const fetchRecent = async () => {
        try {
            // "Recent" usually implies sorted by date, ignoring folder structure.
            // My GET /api/files already sorts by createdAt -1.
            // But it filters by parent. I need a way to get *all* files ignoring parent.
            const res = await axios.get("/api/files?recent=true");
            setFiles(res.data);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="p-8 bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-500">
                <Clock className="w-6 h-6" /> Recent
            </h1>

            <div className="space-y-2">
                {files.map((file) => (
                    <div key={file._id} className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-gray-200 dark:border-zinc-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                        <div className="flex items-center gap-3 w-1/2">
                            <FileIcon className="w-5 h-5 text-gray-500" />
                            <span className="truncate font-medium">{file.name}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                            {new Date(file.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 w-24 text-right">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                    </div>
                ))}
                {files.length === 0 && <p className="text-gray-500">No recent files.</p>}
            </div>

            <button onClick={() => router.push("/dashboard")} className="mt-8 text-blue-600 hover:underline">
                Back to Drive
            </button>
        </div>
    );
}
