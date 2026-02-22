"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Trash2, RotateCcw, File as FileIcon, Folder, Star, Settings, ArrowLeft } from "lucide-react";

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
        <div className="min-h-screen bg-background text-foreground pb-20 md:pb-8">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 sm:px-6 py-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/dashboard")} className="p-2 hover:bg-secondary rounded-lg transition-colors md:hidden">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Trash2 className="w-6 h-6 text-red-500" />
                    <h1 className="text-xl sm:text-2xl font-bold">Trash</h1>
                </div>
            </header>

            {/* Content */}
            <main className="p-4 sm:p-8">
                {items.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Trash2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>Trash is empty</p>
                        <p className="text-sm mt-2">Deleted files will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-2 sm:space-y-3">
                        {items.map((item) => (
                            <div key={item._id} className="bg-card p-3 sm:p-4 rounded-xl border border-border flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                                    <div className="p-2 bg-secondary rounded-lg flex-shrink-0">
                                        <FileIcon className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <span className="truncate text-sm sm:text-base">{item.name}</span>
                                </div>
                                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => restoreItem(item._id)}
                                        className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors"
                                        title="Restore"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => permanentDelete(item._id)}
                                        className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                        title="Delete Forever"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-card/95 backdrop-blur-xl border-t border-border">
                <div className="flex items-center justify-around py-2">
                    <Link href="/dashboard" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-primary transition-colors">
                        <Folder className="w-5 h-5" />
                        <span className="text-xs">Drive</span>
                    </Link>
                    <Link href="/dashboard/starred" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-primary transition-colors">
                        <Star className="w-5 h-5" />
                        <span className="text-xs">Starred</span>
                    </Link>
                    <Link href="/dashboard/trash" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
                        <Trash2 className="w-5 h-5" />
                        <span className="text-xs font-medium">Trash</span>
                    </Link>
                    <Link href="/settings" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-primary transition-colors">
                        <Settings className="w-5 h-5" />
                        <span className="text-xs">Settings</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
