"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Link2, Copy, Check, Trash2, ExternalLink, BarChart3,
    Sparkles, ArrowRight, Loader2
} from "lucide-react";
import axios from "axios";

interface UrlItem {
    _id: string;
    shortCode: string;
    originalUrl: string;
    clicks: number;
    createdAt: string;
}

export default function UrlShortenerPage() {
    const { data: session } = useSession();
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ shortUrl: string; shortCode: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [urls, setUrls] = useState<UrlItem[]>([]);
    const [loadingUrls, setLoadingUrls] = useState(true);

    useEffect(() => {
        fetchUrls();
    }, []);

    const fetchUrls = async () => {
        try {
            const res = await axios.get("/api/url");
            setUrls(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingUrls(false);
        }
    };

    const handleShorten = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await axios.post("/api/url", { originalUrl: url });
            setResult({
                shortUrl: res.data.shortUrl,
                shortCode: res.data.shortCode
            });
            setUrl("");
            fetchUrls();
        } catch (error: any) {
            alert(error.response?.data || "Failed to shorten URL");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const input = document.createElement("input");
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this shortened URL?")) return;
        try {
            await axios.delete(`/api/url/${id}`);
            fetchUrls();
        } catch {
            alert("Failed to delete");
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/url" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Link2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">DM-Link</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {session ? (
                            <span className="text-white/60 text-sm hidden sm:block">
                                {session.user?.email}
                            </span>
                        ) : (
                            <Link
                                href="/login"
                                className="text-sm text-white/80 hover:text-white transition-colors"
                            >
                                Sign in to save links
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 text-violet-300 text-sm mb-6">
                        <Sparkles className="w-4 h-4" />
                        Free URL Shortener
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                        Shorten Your Links,
                        <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"> Instantly</span>
                    </h1>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        Create short, memorable links in seconds. Track clicks and manage all your URLs in one place.
                    </p>
                </motion.div>

                {/* Shorten Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleShorten}
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                        <div className="flex-1 relative">
                            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste your long URL here..."
                                className="w-full bg-transparent text-white placeholder:text-white/40 pl-12 pr-4 py-4 outline-none text-lg"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl
                                     hover:from-violet-600 hover:to-fuchsia-600 transition-all disabled:opacity-50
                                     flex items-center justify-center gap-2 min-w-[160px]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Shorten <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </motion.form>

                {/* Result */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-green-500/20 border border-green-500/30 rounded-2xl mb-12"
                    >
                        <p className="text-green-400 text-sm mb-2">Your shortened URL is ready!</p>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={result.shortUrl}
                                readOnly
                                className="flex-1 bg-white/10 text-white text-lg px-4 py-3 rounded-xl outline-none"
                            />
                            <button
                                onClick={() => copyToClipboard(result.shortUrl)}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                {copied ? (
                                    <Check className="w-6 h-6 text-green-400" />
                                ) : (
                                    <Copy className="w-6 h-6 text-white" />
                                )}
                            </button>
                            <a
                                href={result.shortUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <ExternalLink className="w-6 h-6 text-white" />
                            </a>
                        </div>
                    </motion.div>
                )}

                {/* User's URLs */}
                {session && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-violet-400" />
                            Your Links
                        </h2>

                        {loadingUrls ? (
                            <div className="text-center py-12 text-white/40">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                            </div>
                        ) : urls.length === 0 ? (
                            <div className="text-center py-12 text-white/40 bg-white/5 rounded-2xl border border-white/10">
                                <Link2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No shortened URLs yet</p>
                                <p className="text-sm">Create your first short link above!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {urls.map((item) => (
                                    <div
                                        key={item._id}
                                        className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <a
                                                        href={`/url/${item.shortCode}`}
                                                        target="_blank"
                                                        className="text-violet-400 font-medium hover:underline"
                                                    >
                                                        /url/{item.shortCode}
                                                    </a>
                                                    <span className="text-white/40 text-sm">
                                                        • {item.clicks} clicks
                                                    </span>
                                                </div>
                                                <p className="text-white/60 text-sm truncate" title={item.originalUrl}>
                                                    {item.originalUrl}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white/40 text-xs">
                                                    {formatDate(item.createdAt)}
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(`${window.location.origin}/url/${item.shortCode}`)}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Copy"
                                                >
                                                    <Copy className="w-4 h-4 text-white/60" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-6 mt-auto">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-white/40 text-sm">
                    <p>© 2024 DM-Link. Part of <Link href="/" className="text-violet-400 hover:underline">DM-Drive</Link> ecosystem.</p>
                </div>
            </footer>
        </div>
    );
}
