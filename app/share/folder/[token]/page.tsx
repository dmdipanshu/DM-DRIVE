"use client";

import { useState, useEffect } from "react";
import { Download, Folder as FolderIcon, File as FileIcon, Lock, AlertCircle, Clock, Shield, Sparkles, ChevronRight, Home, Image, Video, FileText, Music, Archive, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface FileData {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    googleFileId?: string;
}

interface FolderData {
    id: string;
    name: string;
    color?: string;
}

interface FolderInfo {
    id: string;
    name: string;
    currentFolder: {
        id: string;
        name: string;
        isRoot: boolean;
    };
}

export default function FolderSharePage({ params }: { params: { token: string } }) {
    const [status, setStatus] = useState<"loading" | "password" | "ready" | "error" | "expired">("loading");
    const [folder, setFolder] = useState<FolderInfo | null>(null);
    const [subfolders, setSubfolders] = useState<FolderData[]>([]);
    const [files, setFiles] = useState<FileData[]>([]);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [currentSubfolderId, setCurrentSubfolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
    const [downloading, setDownloading] = useState<string | null>(null);

    const verifyAccess = async (pwd?: string, subfolderId?: string | null) => {
        try {
            const res = await fetch("/api/share/folder/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: params.token,
                    password: pwd || password,
                    subfolderId
                }),
            });

            const data = await res.json();

            if (data.valid) {
                setFolder(data.folder);
                setSubfolders(data.subfolders || []);
                setFiles(data.files || []);
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

    const navigateToFolder = (folderId: string, folderName: string) => {
        setCurrentSubfolderId(folderId);
        setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
        verifyAccess(password, folderId);
    };

    const navigateBack = () => {
        if (breadcrumbs.length === 0) return;

        const newBreadcrumbs = [...breadcrumbs];
        newBreadcrumbs.pop();
        setBreadcrumbs(newBreadcrumbs);

        const prevFolderId = newBreadcrumbs.length > 0 ? newBreadcrumbs[newBreadcrumbs.length - 1].id : null;
        setCurrentSubfolderId(prevFolderId);
        verifyAccess(password, prevFolderId);
    };

    const navigateToRoot = () => {
        setBreadcrumbs([]);
        setCurrentSubfolderId(null);
        verifyAccess(password, null);
    };

    const handleDownload = async (file: FileData) => {
        setDownloading(file.id);

        const downloadUrl = `/api/share/folder/download?token=${params.token}&fileId=${file.id}${password ? `&password=${encodeURIComponent(password)}` : ''}`;
        window.open(downloadUrl, '_blank');

        setTimeout(() => setDownloading(null), 2000);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType?.includes("image")) return <Image className="w-5 h-5 text-purple-400" />;
        if (mimeType?.includes("video")) return <Video className="w-5 h-5 text-pink-400" />;
        if (mimeType?.includes("audio")) return <Music className="w-5 h-5 text-green-400" />;
        if (mimeType?.includes("pdf")) return <FileText className="w-5 h-5 text-red-400" />;
        if (mimeType?.includes("zip") || mimeType?.includes("rar")) return <Archive className="w-5 h-5 text-amber-400" />;
        return <FileIcon className="w-5 h-5 text-blue-400" />;
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
                    <p className="text-white/60">This shared folder link is no longer valid.</p>
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
                    <h1 className="text-2xl font-bold text-white mb-2">Folder Not Found</h1>
                    <p className="text-white/60">{error || "This link is invalid or the folder was deleted."}</p>
                </motion.div>
            </div>
        );
    }

    // Password Required State
    if (status === "password") {
        return (
            <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
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
                    <p className="text-white/60 mb-6">Enter the password to access this folder.</p>

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
                            Unlock Folder
                        </button>
                    </form>
                </motion.div>

                <p className="absolute bottom-6 text-white/30 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Powered by DM-Drive
                </p>
            </div>
        );
    }

    // Ready - Show Folder Contents
    return (
        <div className="min-h-screen mesh-gradient p-4 sm:p-8">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto glass-dark rounded-3xl overflow-hidden relative z-10"
            >
                {/* Header */}
                <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                            <FolderIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{folder?.name}</h1>
                            <p className="text-white/60 text-sm">Shared folder</p>
                        </div>
                    </div>

                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1 flex-wrap">
                        <button
                            onClick={navigateToRoot}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 text-white/80 text-sm transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            {folder?.name}
                        </button>
                        {breadcrumbs.map((crumb, i) => (
                            <span key={crumb.id} className="flex items-center">
                                <ChevronRight className="w-4 h-4 text-white/40" />
                                <button
                                    onClick={() => {
                                        const newBreadcrumbs = breadcrumbs.slice(0, i + 1);
                                        setBreadcrumbs(newBreadcrumbs);
                                        setCurrentSubfolderId(crumb.id);
                                        verifyAccess(password, crumb.id);
                                    }}
                                    className="px-2 py-1 rounded-lg hover:bg-white/10 text-white/80 text-sm transition-colors"
                                >
                                    {crumb.name}
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Contents */}
                <div className="p-6">
                    {/* Back button if in subfolder */}
                    {breadcrumbs.length > 0 && (
                        <button
                            onClick={navigateBack}
                            className="flex items-center gap-2 px-3 py-2 mb-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}

                    {/* Subfolders */}
                    {subfolders.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Folders</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {subfolders.map((subfolder) => (
                                    <motion.button
                                        key={subfolder.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigateToFolder(subfolder.id, subfolder.name)}
                                        className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group"
                                    >
                                        <FolderIcon className="w-10 h-10 text-blue-400 fill-blue-400/20 mb-2 group-hover:text-blue-300 transition-colors" />
                                        <p className="text-white text-sm font-medium truncate">{subfolder.name}</p>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files */}
                    {files.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Files</h2>
                            <div className="space-y-2">
                                {files.map((file) => (
                                    <motion.div
                                        key={file.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                            {getFileIcon(file.mimeType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium truncate">{file.name}</p>
                                            <p className="text-white/50 text-xs">{formatBytes(file.size)}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDownload(file)}
                                            disabled={downloading === file.id}
                                            className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-all disabled:opacity-50"
                                        >
                                            {downloading === file.id ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                    className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                                                />
                                            ) : (
                                                <Download className="w-5 h-5" />
                                            )}
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {subfolders.length === 0 && files.length === 0 && (
                        <div className="text-center py-12">
                            <FolderIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
                            <p className="text-white/40">This folder is empty</p>
                        </div>
                    )}
                </div>
            </motion.div>

            <p className="text-center mt-6 text-white/30 text-sm flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Powered by DM-Drive
            </p>
        </div>
    );
}
