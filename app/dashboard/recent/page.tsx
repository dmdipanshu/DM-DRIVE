"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Clock, File as FileIcon, Folder, Star, Trash2, Settings, ArrowLeft } from "lucide-react";

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
            const res = await axios.get("/api/files?recent=true");
            setFiles(res.data);
        } catch (error) {
            console.error(error);
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
                    <Clock className="w-6 h-6 text-blue-500" />
                    <h1 className="text-xl sm:text-2xl font-bold">Recent</h1>
                </div>
            </header>

            {/* Content */}
            <main className="p-4 sm:p-8">
                {files.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>No recent files</p>
                        <p className="text-sm mt-2">Recently accessed files will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-2 sm:space-y-3">
                        {files.map((file) => (
                            <div key={file._id} className="bg-card p-3 sm:p-4 rounded-xl border border-border flex items-center justify-between gap-2 hover:border-primary/50 transition-all">
                                <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                                    <div className="p-2 bg-secondary rounded-lg flex-shrink-0">
                                        <FileIcon className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <span className="truncate text-sm sm:text-base font-medium">{file.name}</span>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                                    <span className="hidden sm:block">{new Date(file.createdAt).toLocaleDateString()}</span>
                                    <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
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
                    <Link href="/dashboard/trash" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-primary transition-colors">
                        <Trash2 className="w-5 h-5" />
                        <span className="text-xs">Trash</span>
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
