"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Files, Activity, Home, Shield, Trash2, CheckCircle, Menu, X, RefreshCw } from "lucide-react";
import axios from "axios";

interface User {
    _id: string;
    name: string;
    email: string;
    storageUsed: number;
    storageLimit: number;
    isAdmin: boolean;
    createdAt: string;
}

interface Stats {
    totalUsers: number;
    totalFiles: number;
    totalStorage: number;
    activeToday: number;
}

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalFiles: 0, totalStorage: 0, activeToday: 0 });
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"overview" | "users" | "logs">("overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            checkAdmin();
        }
    }, [status]);

    const checkAdmin = async () => {
        try {
            const res = await axios.get("/api/admin/verify");
            if (res.data.isAdmin) {
                setIsAdmin(true);
                fetchData();
            } else {
                router.push("/dashboard");
            }
        } catch {
            router.push("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const [statsRes, usersRes, logsRes] = await Promise.all([
                axios.get("/api/admin/stats"),
                axios.get("/api/admin/users"),
                axios.get("/api/admin/logs")
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setLogs(logsRes.data.logs || []);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setRefreshing(false);
        }
    };

    const toggleAdmin = async (userId: string, makeAdmin: boolean) => {
        if (!confirm(`Are you sure you want to ${makeAdmin ? "make this user an admin" : "remove admin rights"}?`)) return;
        try {
            await axios.put(`/api/admin/users/${userId}`, { isAdmin: makeAdmin });
            fetchData();
        } catch {
            alert("Failed to update user");
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm("This will permanently delete the user and all their files. Continue?")) return;
        try {
            await axios.delete(`/api/admin/users/${userId}`);
            fetchData();
        } catch {
            alert("Failed to delete user");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center mesh-gradient">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen mesh-gradient text-white flex">
            {/* Mobile Menu Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-72 md:w-64 glass-dark border-r border-white/10
                transform transition-transform duration-300 ease-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">Admin</span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/10 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2 flex-1">
                        {[
                            { id: "overview", icon: Activity, label: "Overview" },
                            { id: "users", icon: Users, label: "Users" },
                            { id: "logs", icon: Files, label: "Logs" }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id as any); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                    ${activeTab === item.id
                                        ? "bg-gradient-to-r from-primary to-accent text-white"
                                        : "hover:bg-white/10 text-white/70 hover:text-white"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Footer */}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all"
                    >
                        <Home className="w-5 h-5" />
                        Back to Drive
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                {/* Mobile Header */}
                <div className="flex items-center justify-between mb-6 md:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 glass-dark rounded-xl">
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold">Admin Panel</h1>
                    <button onClick={fetchData} className={`p-2 glass-dark rounded-xl ${refreshing ? 'animate-spin' : ''}`}>
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-2xl sm:text-3xl font-bold hidden md:block">Dashboard Overview</h1>
                            <button
                                onClick={fetchData}
                                className={`hidden md:flex items-center gap-2 px-4 py-2 glass-dark rounded-xl hover:bg-white/10 transition-all ${refreshing ? 'opacity-50' : ''}`}
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-6 h-6" />} gradient="from-blue-500 to-cyan-500" />
                            <StatCard title="Total Files" value={stats.totalFiles} icon={<Files className="w-6 h-6" />} gradient="from-green-500 to-emerald-500" />
                            <StatCard title="Storage Used" value={`${(stats.totalStorage / 1024 / 1024 / 1024).toFixed(2)} GB`} icon={<Activity className="w-6 h-6" />} gradient="from-purple-500 to-pink-500" />
                            <StatCard title="Active Today" value={stats.activeToday} icon={<CheckCircle className="w-6 h-6" />} gradient="from-amber-500 to-orange-500" />
                        </div>

                        {/* Recent Users */}
                        <h2 className="text-xl font-bold mb-4">Recent Users</h2>
                        <div className="glass-dark rounded-2xl overflow-hidden">
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="text-left p-4 text-white/60 font-medium">Name</th>
                                            <th className="text-left p-4 text-white/60 font-medium">Email</th>
                                            <th className="text-left p-4 text-white/60 font-medium">Joined</th>
                                            <th className="text-left p-4 text-white/60 font-medium">Storage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.slice(0, 5).map((user) => (
                                            <tr key={user._id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-medium">{user.name}</td>
                                                <td className="p-4 text-white/60">{user.email}</td>
                                                <td className="p-4 text-white/60">{new Date(user.createdAt).toLocaleDateString()}</td>
                                                <td className="p-4">{(user.storageUsed / 1024 / 1024).toFixed(1)} MB</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y divide-white/5">
                                {users.slice(0, 5).map((user) => (
                                    <div key={user._id} className="p-4">
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-sm text-white/60">{user.email}</p>
                                        <div className="flex justify-between mt-2 text-sm">
                                            <span className="text-white/40">{new Date(user.createdAt).toLocaleDateString()}</span>
                                            <span>{(user.storageUsed / 1024 / 1024).toFixed(1)} MB</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-6 hidden md:block">User Management</h1>

                        <div className="glass-dark rounded-2xl overflow-hidden">
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="text-left p-4 text-white/60 font-medium">Name</th>
                                            <th className="text-left p-4 text-white/60 font-medium">Email</th>
                                            <th className="text-left p-4 text-white/60 font-medium">Role</th>
                                            <th className="text-left p-4 text-white/60 font-medium">Storage</th>
                                            <th className="text-left p-4 text-white/60 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user._id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-medium">{user.name}</td>
                                                <td className="p-4 text-white/60">{user.email}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isAdmin ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/60"
                                                        }`}>
                                                        {user.isAdmin ? "Admin" : "User"}
                                                    </span>
                                                </td>
                                                <td className="p-4">{(user.storageUsed / 1024 / 1024).toFixed(1)} MB</td>
                                                <td className="p-4 flex gap-2">
                                                    <button
                                                        onClick={() => toggleAdmin(user._id, !user.isAdmin)}
                                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                        title={user.isAdmin ? "Remove Admin" : "Make Admin"}
                                                    >
                                                        <Shield className={`w-4 h-4 ${user.isAdmin ? "text-red-400" : "text-white/40"}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(user._id)}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile/Tablet Cards */}
                            <div className="lg:hidden divide-y divide-white/5">
                                {users.map((user) => (
                                    <div key={user._id} className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium truncate">{user.name}</p>
                                                    {user.isAdmin && (
                                                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Admin</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-white/60 truncate">{user.email}</p>
                                                <p className="text-xs text-white/40 mt-1">{(user.storageUsed / 1024 / 1024).toFixed(1)} MB used</p>
                                            </div>
                                            <div className="flex gap-1 ml-2">
                                                <button
                                                    onClick={() => toggleAdmin(user._id, !user.isAdmin)}
                                                    className="p-2 hover:bg-white/10 rounded-lg"
                                                >
                                                    <Shield className={`w-5 h-5 ${user.isAdmin ? "text-red-400" : "text-white/40"}`} />
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user._id)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Logs Tab */}
                {activeTab === "logs" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-6 hidden md:block">System Logs</h1>
                        <div className="glass-dark rounded-2xl p-4 font-mono text-xs sm:text-sm max-h-[calc(100vh-200px)] overflow-y-auto">
                            {logs.length === 0 ? (
                                <p className="text-white/40 text-center py-10">No logs available</p>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="py-2 border-b border-white/5 last:border-0 text-white/80 break-all">
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}

function StatCard({ title, value, icon, gradient }: { title: string; value: string | number; icon: React.ReactNode; gradient: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-dark rounded-2xl p-4 sm:p-6"
        >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 sm:mb-4`}>
                {icon}
            </div>
            <p className="text-white/60 text-xs sm:text-sm">{title}</p>
            <p className="text-xl sm:text-2xl font-bold">{value}</p>
        </motion.div>
    );
}
