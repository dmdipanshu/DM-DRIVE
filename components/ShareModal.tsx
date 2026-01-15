"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Link2, Copy, Check, Lock, Clock,
    Eye, EyeOff, Share2, Loader2, ExternalLink, Folder
} from "lucide-react";
import axios from "axios";

interface ShareModalProps {
    file: {
        _id: string;
        name: string;
    };
    isFolder?: boolean;
    onClose: () => void;
}

export default function ShareModal({ file, isFolder = false, onClose }: ShareModalProps) {
    const [loading, setLoading] = useState(false);
    const [shareLink, setShareLink] = useState("");
    const [copied, setCopied] = useState(false);

    // Link Options
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [expiryDays, setExpiryDays] = useState<number | "">("");
    const [linkGenerated, setLinkGenerated] = useState(false);

    const generateLink = async () => {
        setLoading(true);
        try {
            const endpoint = isFolder ? "/api/folders/share" : "/api/share";
            const payload = isFolder
                ? { folderId: file._id, action: "generate_link", password: password || null, expiryDays: expiryDays || null }
                : { fileId: file._id, action: "generate_link", password: password || null, expiryDays: expiryDays || null };

            const res = await axios.post(endpoint, payload);
            setShareLink(res.data.link);
            setLinkGenerated(true);
        } catch (error) {
            alert("Failed to generate link");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const input = document.createElement("input");
            input.value = shareLink;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };



    const expiryOptions = [
        { value: "", label: "Never expires" },
        { value: 0.04, label: "1 hour" },
        { value: 0.25, label: "6 hours" },
        { value: 0.5, label: "12 hours" },
        { value: 1, label: "1 day" },
        { value: 3, label: "3 days" },
        { value: 7, label: "7 days" },
        { value: 14, label: "14 days" },
        { value: 30, label: "30 days" },
        { value: 60, label: "60 days" },
        { value: 90, label: "90 days" },
        { value: 180, label: "180 days" },
        { value: 365, label: "1 year" }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", damping: 25 }}
                    className="w-full max-w-md glass-dark rounded-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    {isFolder ? <Folder className="w-5 h-5 text-white" /> : <Share2 className="w-5 h-5 text-white" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">{isFolder ? "Share Folder" : "Share File"}</h2>
                                    <p className="text-sm text-white/60 truncate max-w-[200px]">{file.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="space-y-4">
                            {!linkGenerated ? (
                                <>
                                    {/* Password Protection */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                                            <Lock className="w-4 h-4" />
                                            Password Protection (optional)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Enter password"
                                                className="input-glass pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expiration */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                                            <Clock className="w-4 h-4" />
                                            Link Expiration
                                        </label>
                                        <select
                                            value={expiryDays}
                                            onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value) : "")}
                                            className="input-glass appearance-none cursor-pointer"
                                        >
                                            {expiryOptions.map((opt) => (
                                                <option key={opt.label} value={opt.value} className="bg-zinc-900">
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Generate Button */}
                                    <button
                                        onClick={generateLink}
                                        disabled={loading}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold
                                                     hover:opacity-90 active:scale-95 transition-all disabled:opacity-50
                                                     flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Link2 className="w-5 h-5" />
                                                Generate Link
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Link Display */}
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <p className="text-xs text-white/40 mb-2">Share Link</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={shareLink}
                                                readOnly
                                                className="flex-1 bg-transparent text-white text-sm outline-none truncate"
                                            />
                                            <button
                                                onClick={copyToClipboard}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                {copied ? (
                                                    <Check className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <Copy className="w-5 h-5 text-white/60" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Link Info */}
                                    <div className="flex flex-wrap gap-2">
                                        {password && (
                                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> Password Protected
                                            </span>
                                        )}
                                        {expiryDays && (
                                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Expires in {
                                                    Number(expiryDays) < 1
                                                        ? `${Math.round(Number(expiryDays) * 24)} hours`
                                                        : `${expiryDays} days`
                                                }
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={copyToClipboard}
                                            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium
                                                         hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                            {copied ? "Copied!" : "Copy Link"}
                                        </button>
                                        <a
                                            href={shareLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                                        >
                                            <ExternalLink className="w-5 h-5 text-white" />
                                        </a>
                                    </div>

                                    {/* Generate New */}
                                    <button
                                        onClick={() => { setLinkGenerated(false); setShareLink(""); }}
                                        className="w-full py-2 text-white/50 hover:text-white text-sm transition-colors"
                                    >
                                        Generate New Link
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
