"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Eye, X, File as FileIcon, Lock, AlertCircle, Clock, Shield, Sparkles, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    const [showPreview, setShowPreview] = useState(false);

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
        const downloadUrl = `/api/share/download?token=${params.token}${password ? `&password=${encodeURIComponent(password)}` : ''}`;
        window.open(downloadUrl, '_blank');
        setTimeout(() => setDownloading(false), 2000);
    };

    // Close preview on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setShowPreview(false);
        };
        if (showPreview) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [showPreview]);

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

    const getFileTypeLabel = (mimeType: string) => {
        if (mimeType?.includes("image")) return "Image";
        if (mimeType?.includes("video")) return "Video";
        if (mimeType?.includes("audio")) return "Audio";
        if (mimeType?.includes("pdf")) return "PDF Document";
        if (mimeType?.includes("zip") || mimeType?.includes("rar")) return "Archive";
        if (mimeType?.includes("text")) return "Text File";
        return "File";
    };

    const canPreview = (mimeType: string) => {
        return (
            mimeType?.includes("image") ||
            mimeType?.includes("video") ||
            mimeType?.includes("audio") ||
            mimeType?.includes("pdf")
        );
    };

    const getPreviewUrl = () => {
        return `/api/share/download?token=${params.token}&inline=true${password ? `&password=${encodeURIComponent(password)}` : ''}`;
    };

    // Full-screen Preview Modal
    const renderPreviewModal = () => {
        if (!file?.mimeType || !showPreview) return null;

        const previewUrl = getPreviewUrl();

        const renderContent = () => {
            if (file.mimeType.includes("image")) {
                return (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={previewUrl}
                            alt={file.name}
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl shadow-black/50"
                        />
                    </motion.div>
                );
            }

            if (file.mimeType.includes("video")) {
                return (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-[90vw] max-w-5xl max-h-[85vh]"
                    >
                        <video
                            src={previewUrl}
                            controls
                            autoPlay
                            className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl shadow-black/50"
                        />
                    </motion.div>
                );
            }

            if (file.mimeType.includes("audio")) {
                return (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-[90vw] max-w-lg glass-dark rounded-3xl p-8"
                    >
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30 text-4xl">
                                🎵
                            </div>
                            <h3 className="text-white text-lg font-semibold truncate">{file.name}</h3>
                            <p className="text-white/50 text-sm mt-1">{formatBytes(file.size)}</p>
                        </div>
                        <audio
                            src={previewUrl}
                            controls
                            autoPlay
                            className="w-full"
                        />
                    </motion.div>
                );
            }

            if (file.mimeType.includes("pdf")) {
                return (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-[92vw] max-w-5xl h-[88vh] rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
                    >
                        <iframe
                            src={previewUrl}
                            className="w-full h-full border-0 bg-white rounded-2xl"
                            title={file.name}
                        />
                    </motion.div>
                );
            }

            // Unsupported type
            return (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="glass-dark rounded-3xl p-10 text-center max-w-md"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg text-4xl">
                        <EyeOff className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">Preview Not Available</h3>
                    <p className="text-white/50 text-sm mb-6">This file type cannot be previewed. Please download it instead.</p>
                    <button
                        onClick={() => { setShowPreview(false); handleDownload(); }}
                        className="bg-gradient-to-r from-primary to-accent text-white font-bold py-3 px-8 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/30"
                    >
                        <Download className="w-5 h-5 mr-2 inline" />
                        Download
                    </button>
                </motion.div>
            );
        };

        return (
            <AnimatePresence>
                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        onClick={() => setShowPreview(false)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" />

                        {/* Close Button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ delay: 0.15 }}
                            onClick={(e) => { e.stopPropagation(); setShowPreview(false); }}
                            className="absolute top-5 right-5 z-[60] w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center transition-all group"
                        >
                            <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
                        </motion.button>

                        {/* File Name Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: 0.1 }}
                            className="absolute top-5 left-5 z-[60] flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-5 py-2.5"
                        >
                            <span className="text-xl">{getFileIcon(file.mimeType)}</span>
                            <span className="text-white text-sm font-medium truncate max-w-[200px] md:max-w-[400px]">{file.name}</span>
                        </motion.div>

                        {/* Content */}
                        <div className="relative z-[55]" onClick={(e) => e.stopPropagation()}>
                            {renderContent()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
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

    // ============================================================
    // READY STATE — Two buttons: Preview + Download
    // ============================================================
    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
            {/* Floating decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass-dark rounded-3xl overflow-hidden relative z-10"
            >
                {/* Header gradient bar */}
                <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />

                <div className="p-8 text-center">
                    {/* File Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30 text-4xl"
                    >
                        {getFileIcon(file?.mimeType || "")}
                    </motion.div>

                    {/* File Name */}
                    <h1 className="text-2xl font-bold text-white mb-1 truncate px-4" title={file?.name}>
                        {file?.name}
                    </h1>

                    {/* File Meta */}
                    <div className="flex items-center justify-center gap-2 text-white/50 text-sm mb-8">
                        <span>{formatBytes(file?.size || 0)}</span>
                        <span className="w-1 h-1 bg-white/30 rounded-full" />
                        <span>{getFileTypeLabel(file?.mimeType || "")}</span>
                    </div>

                    {/* ===== TWO ACTION BUTTONS ===== */}
                    <div className="flex gap-3">
                        {/* Preview Button */}
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                                if (canPreview(file?.mimeType || "")) {
                                    setShowPreview(true);
                                } else {
                                    setShowPreview(true); // Show "not available" prompt
                                }
                            }}
                            className="flex-1 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold py-4 px-5 rounded-xl flex items-center justify-center transition-all backdrop-blur-sm group"
                        >
                            <Eye className="w-5 h-5 mr-2.5 group-hover:scale-110 transition-transform" />
                            Preview
                        </motion.button>

                        {/* Download Button */}
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex-1 bg-gradient-to-r from-primary to-accent text-white font-bold py-4 px-5 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-primary/30 disabled:opacity-70"
                        >
                            {downloading ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2.5"
                                    />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5 mr-2.5" />
                                    Download
                                </>
                            )}
                        </motion.button>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-white/40 text-xs">
                            Secure file sharing powered by DM-Drive
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Branding */}
            <p className="absolute bottom-6 text-white/30 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Powered by DM-Drive
            </p>

            {/* Preview Modal Overlay */}
            {renderPreviewModal()}
        </div>
    );
}
