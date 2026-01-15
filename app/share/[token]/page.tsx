"use client";

import { useState, useEffect } from "react";
import { Download, File as FileIcon, Lock, AlertCircle, Clock, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface FileData {
    id: string;
    name: string;
    size: number;
    mimeType: string;
}

export default function SharePage({ params }: { params: { token: string } }) {
    const [status, setStatus] = useState<"loading" | "password" | "ready" | "error" | "expired">("loading");
    const [file, setFile] = useState<FileData | null>(null);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [downloading, setDownloading] = useState(false);

    const verifyAccess = async (pwd?: string) => {
        try {
            const res = await fetch("/api/share/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: params.token, password: pwd }),
            });

            const data = await res.json();

            if (data.valid) {
                setFile(data.file);
                setStatus("ready");
            } else if (data.requiresPassword) {
                setStatus("password");
            } else if (data.error === "Link has expired") {
                setStatus("expired");
            } else {
                setError(data.error || "Invalid link");
                if (status !== "password") {
                    setStatus("error");
                }
            }
        } catch {
            setError("Failed to verify link");
            setStatus("error");
        }
    };

    useEffect(() => {
        verifyAccess();
    }, []);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        verifyAccess(password);
    };

    const handleDownload = async () => {
        if (!file) return;
        setDownloading(true);

        // Open download in new tab to prevent redirect
        const downloadUrl = `/api/share/download?token=${params.token}${password ? `&password=${encodeURIComponent(password)}` : ''}`;
        window.open(downloadUrl, '_blank');

        setTimeout(() => setDownloading(false), 2000);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType?.includes("image")) return "🖼️";
        if (mimeType?.includes("video")) return "🎬";
        if (mimeType?.includes("audio")) return "🎵";
        if (mimeType?.includes("pdf")) return "📄";
        if (mimeType?.includes("zip") || mimeType?.includes("rar")) return "📦";
        return "📁";
    };

    // Loading State
    if (status === "loading") {
        return (
            <div className="min-h-screen mesh-gradient flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    // Expired State
    if (status === "expired") {
        return (
            <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md glass-dark rounded-3xl p-8 text-center"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
                        <Clock className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Link Expired</h1>
                    <p className="text-white/60">This download link is no longer valid.</p>
                </motion.div>
            </div>
        );
    }

    // Error State
    if (status === "error") {
        return (
            <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md glass-dark rounded-3xl p-8 text-center"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
                        <AlertCircle className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">File Not Found</h1>
                    <p className="text-white/60">{error || "This link is invalid or the file was deleted."}</p>
                </motion.div>
            </div>
        );
    }

    // Password Required State
    if (status === "password") {
        return (
            <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
                {/* Floating decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md glass-dark rounded-3xl p-8 text-center relative z-10"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                        <Lock className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Password Protected</h1>
                    <p className="text-white/60 mb-6">Enter the password to access this file.</p>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-12 py-4 text-white placeholder:text-white/40 focus:ring-2 ring-primary/50 outline-none transition-all"
                                autoFocus
                            />
                        </div>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-sm"
                            >
                                {error}
                            </motion.p>
                        )}
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary to-accent text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/30"
                        >
                            Unlock File
                        </button>
                    </form>
                </motion.div>

                <p className="absolute bottom-6 text-white/30 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Powered by DM-Drive
                </p>
            </div>
        );
    }

    // Ready to Download State
    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
            {/* Floating decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass-dark rounded-3xl overflow-hidden relative z-10"
            >
                {/* Header gradient */}
                <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />

                <div className="p-8 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30 text-4xl"
                    >
                        {getFileIcon(file?.mimeType || "")}
                    </motion.div>

                    <h1 className="text-2xl font-bold text-white mb-1 truncate px-4" title={file?.name}>
                        {file?.name}
                    </h1>
                    <p className="text-white/60 text-sm mb-8">
                        {formatBytes(file?.size || 0)} • Ready to download
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full bg-gradient-to-r from-primary to-accent text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-primary/30 disabled:opacity-70"
                    >
                        {downloading ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                                />
                                Starting Download...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5 mr-3" />
                                Download File
                            </>
                        )}
                    </motion.button>

                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-white/40 text-xs">
                            Secure file sharing powered by DM-Drive
                        </p>
                    </div>
                </div>
            </motion.div>

            <p className="absolute bottom-6 text-white/30 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Powered by DM-Drive
            </p>
        </div>
    );
}
