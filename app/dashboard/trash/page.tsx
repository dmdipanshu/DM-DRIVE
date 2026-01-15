"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Trash2, RotateCcw, File as FileIcon } from "lucide-react";

export default function TrashPage() {
    const { status } = useSession();
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        else if (status === "authenticated") fetchTrash();
    }, [status]);

    const fetchTrash = async () => {
        try {
            // Need a trash endpoint or just filter files?
            // Let's assume we reuse files endpoint but add a param isTrash=true?
            // Wait, our GET /api/files endpoint hardcodes isTrash: false. 
            // We need a new endpoint or update existing one.
            const res = await axios.get("/api/trash");
            setItems(res.data);
        } catch (error) {
            console.error(error);
        }
    }

    const restoreItem = async (id: string) => {
        try {
            await axios.put(`/api/file/${id}`, { isTrash: false });
            fetchTrash();
        } catch (error) {
            alert("Failed to restore");
        }
    }

    const permanentDelete = async (id: string) => {
        if (!confirm("This will permanently delete the file/folder. This cannot be undone.")) return;
        try {
            await axios.delete(`/api/trash?id=${id}`);
            fetchTrash();
        } catch (error) {
            alert("Delete failed");
        }
    }

    return (
        <div className="p-8 bg-gray-50 dark:bg-zinc-950 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trash2 className="w-6 h-6" /> Trash
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <div key={item._id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                                <FileIcon className="w-5 h-5 text-gray-500" />
                            </div>
                            <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => restoreItem(item._id)} className="p-2 hover:bg-green-100 text-green-600 rounded-lg" title="Restore">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button onClick={() => permanentDelete(item._id)} className="p-2 hover:bg-red-100 text-red-600 rounded-lg" title="Delete Forever">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {items.length === 0 && <p className="text-gray-500">Trash is empty</p>}
            </div>

            <button onClick={() => router.push("/dashboard")} className="mt-8 text-blue-600 hover:underline">
                Back to Drive
            </button>
        </div>
    );
}
