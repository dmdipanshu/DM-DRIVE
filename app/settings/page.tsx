"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
    User, Mail, HardDrive, Calendar, Shield, LogOut,
    Save, Loader2, ArrowLeft, Camera, Key, Trash2, Bell
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    image?: string;
    storageUsed: number;
    storageLimit: number;
    createdAt: string;
    isAdmin: boolean;
}

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [name, setName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [activeTab, setActiveTab] = useState<"profile" | "security" | "storage">("profile");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchProfile();
        }
    }, [status]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get("/api/user/profile");
            setProfile(res.data);
            setName(res.data.name);
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            await axios.put("/api/user/profile", { name });
            setMessage({ type: "success", text: "Profile updated successfully!" });
            fetchProfile();
        } catch (error: any) {
            setMessage({ type: "error", text: error.response?.data || "Failed to update profile" });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters" });
            return;
        }

        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            await axios.put("/api/user/password", { currentPassword, newPassword });
            setMessage({ type: "success", text: "Password changed successfully!" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setMessage({ type: "error", text: error.response?.data || "Failed to change password" });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your account? This will permanently delete all your files and cannot be undone.")) return;
        if (!confirm("This is your FINAL warning. All data will be lost. Continue?")) return;

        try {
            await axios.delete("/api/user/profile");
            await signOut({ callbackUrl: "/" });
        } catch (error) {
            alert("Failed to delete account");
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const storagePercent = profile ? Math.round((profile.storageUsed / profile.storageLimit) * 100) : 0;

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center mesh-gradient">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen mesh-gradient">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/dashboard"
                        className="p-2 glass-dark rounded-xl hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
                        <p className="text-white/60 text-sm">Manage your account and preferences</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { id: "profile", icon: User, label: "Profile" },
                        { id: "security", icon: Shield, label: "Security" },
                        { id: "storage", icon: HardDrive, label: "Storage" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap
                                ${activeTab === tab.id
                                    ? "bg-gradient-to-r from-primary to-accent text-white"
                                    : "glass-dark text-white/70 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Message */}
                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl mb-6 ${message.type === "success"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                    >
                        {message.text}
                    </motion.div>
                )}

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {/* Profile Card */}
                        <div className="glass-dark rounded-2xl p-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white">
                                        {profile?.name?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="text-center sm:text-left">
                                    <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
                                    <p className="text-white/60">{profile?.email}</p>
                                    {profile?.isAdmin && (
                                        <span className="inline-block mt-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                                            Admin
                                        </span>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Display Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="input-glass pl-12"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                        <input
                                            type="email"
                                            value={profile?.email || ""}
                                            className="input-glass pl-12 opacity-60"
                                            disabled
                                        />
                                    </div>
                                    <p className="text-xs text-white/40 mt-1">Email cannot be changed</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold
                                             hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Save Changes
                                </button>
                            </form>
                        </div>

                        {/* Account Info */}
                        <div className="glass-dark rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <div className="flex items-center gap-3 text-white/60 mb-1">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm">Member Since</span>
                                    </div>
                                    <p className="text-white font-medium">
                                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        }) : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl">
                                    <div className="flex items-center gap-3 text-white/60 mb-1">
                                        <HardDrive className="w-4 h-4" />
                                        <span className="text-sm">Storage Used</span>
                                    </div>
                                    <p className="text-white font-medium">{formatBytes(profile?.storageUsed || 0)}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {/* Change Password */}
                        <div className="glass-dark rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Key className="w-5 h-5" /> Change Password
                            </h3>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="input-glass"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="input-glass"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="input-glass"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold
                                             hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {saving ? "Updating..." : "Update Password"}
                                </button>
                            </form>
                        </div>

                        {/* Sessions */}
                        <div className="glass-dark rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <LogOut className="w-5 h-5" /> Sessions
                            </h3>
                            <p className="text-white/60 mb-4">Sign out from your current session or all devices.</p>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="px-4 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="glass-dark rounded-2xl p-6 border border-red-500/30">
                            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                                <Trash2 className="w-5 h-5" /> Danger Zone
                            </h3>
                            <p className="text-white/60 mb-4">Once you delete your account, there is no going back. All your files will be permanently deleted.</p>
                            <button
                                onClick={handleDeleteAccount}
                                className="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Account
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Storage Tab */}
                {activeTab === "storage" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="glass-dark rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-6">Storage Usage</h3>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white/60">Used</span>
                                    <span className="text-white font-medium">{storagePercent}%</span>
                                </div>
                                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${storagePercent > 90 ? 'bg-red-500' :
                                                storagePercent > 70 ? 'bg-amber-500' :
                                                    'bg-gradient-to-r from-primary to-accent'
                                            }`}
                                        style={{ width: `${storagePercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-white">{formatBytes(profile?.storageUsed || 0)}</p>
                                    <p className="text-white/60 text-sm">Used</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-white">{formatBytes(profile?.storageLimit || 0)}</p>
                                    <p className="text-white/60 text-sm">Total</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
