"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Folder, File as FileIcon, Upload, Search, LogOut, LayoutGrid, List as ListIcon, Star, MoreVertical, Share2, Download, Trash2, Eye, Edit2, Settings, Filter, Image, Video, FileText, Music, Archive, ArrowUpDown, CheckSquare, Square, X, Menu } from "lucide-react";
import axios from "axios";
import ShareModal from "@/components/ShareModal";
import { motion } from "framer-motion";

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [files, setFiles] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]); // New Folder State
    const [currentFolder, setCurrentFolder] = useState<string | null>(null); // Current folder ID
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [newFolderName, setNewFolderName] = useState("");
    const [showFolderModal, setShowFolderModal] = useState(false);

    // Share & Preview State
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareEmail, setShareEmail] = useState("");
    const [shareLink, setShareLink] = useState("");

    // Preview State
    const [previewFile, setPreviewFile] = useState<any>(null);

    // Stats & Search
    const [stats, setStats] = useState({ used: 0, limit: 1 });
    const [searchQuery, setSearchQuery] = useState("");

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameValue, setRenameValue] = useState("");

    // NEW: Filter, Sort, Bulk Selection
    const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [showAdvancedShare, setShowAdvancedShare] = useState(false);

    // Folder context menu and mobile sidebar
    const [selectedFolder, setSelectedFolder] = useState<any>(null);
    const [folderContextMenu, setFolderContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [showFolderShare, setShowFolderShare] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Close context menu on click elsewhere
    useEffect(() => {
        const handleClick = () => {
            setContextMenu(null);
            setFolderContextMenu(null);
            setShowProfileMenu(false);
        };
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchContent();
            fetchStats();
        }
    }, [status, router, currentFolder]); // Re-fetch when folder changes

    const fetchContent = async (search?: string) => {
        try {
            const params = new URLSearchParams();
            if (currentFolder && !search) params.append("parent", currentFolder);
            else if (!search) params.append("parent", "root");

            if (search) params.append("search", search);

            const [fileRes, folderRes] = await Promise.all([
                axios.get(`/api/files?${params.toString()}`),
                axios.get(`/api/folders?${params.toString()}`)
            ]);

            setFiles(fileRes.data);
            setFolders(folderRes.data);
        } catch (error) {
            console.error("Failed to fetch content", error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/user/stats');
            setStats({ used: res.data.storageUsed, limit: res.data.storageLimit });
        } catch (error) {
            console.error("Failed stats");
        }
    };

    // Debounced search (simplified for MVP)
    useEffect(() => {
        const delay = setTimeout(() => {
            if (searchQuery) fetchContent(searchQuery);
            else if (status === 'authenticated') fetchContent();
        }, 500);
        return () => clearTimeout(delay);
    }, [searchQuery, status, currentFolder]); // Added currentFolder to dependencies for correct behavior when navigating folders with an active search

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("/api/folders", {
                name: newFolderName,
                parent: currentFolder
            });
            setNewFolderName("");
            setShowFolderModal(false);
            fetchContent();
        } catch (error) {
            alert("Failed to create folder");
        }
    };

    const navigateUp = async () => {
        // Simple "up" logic requires knowing parent of current folder.
        // For MVP, we can just go to root or we need to fetch current folder details to know its parent.
        // Let's just implement "Root" button for now or a simple breadcrumb later.
        setCurrentFolder(null); // Go to root for simplicity now
    };

    const handleUpload = async (e: any) => {
        e.preventDefault();
        const uploadedFiles = e.target.files || e.dataTransfer.files;
        if (!uploadedFiles || uploadedFiles.length === 0) return;

        setUploading(true);
        setUploadProgress(0);
        const file = uploadedFiles[0];

        try {
            // Step 1: Init — get a resumable upload URL from our server
            const initRes = await fetch("/api/upload/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    mimeType: file.type || "application/octet-stream",
                    size: file.size.toString(),
                }),
            });

            if (!initRes.ok) {
                const errText = await initRes.text();
                throw new Error(errText || "Failed to initialize upload");
            }

            const { uploadUrl, accessToken } = await initRes.json();

            // Step 2: Upload directly to Google Drive (bypasses Vercel size limit)
            const googleFileId = await new Promise<string>((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percent);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            resolve(data.id);
                        } catch {
                            reject(new Error("Invalid response from Google Drive"));
                        }
                    } else {
                        reject(new Error(`Google Drive upload failed: ${xhr.status}`));
                    }
                };

                xhr.onerror = () => reject(new Error("Network error during upload"));

                xhr.open("PUT", uploadUrl);
                xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
                xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
                xhr.send(file);
            });

            // Step 3: Complete — record in our database
            const completeRes = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    googleFileId,
                    filename: file.name,
                    mimeType: file.type || "application/octet-stream",
                    size: file.size.toString(),
                    parent: currentFolder || null,
                }),
            });

            if (!completeRes.ok) {
                const errText = await completeRes.text();
                throw new Error(errText || "Failed to save file record");
            }

            fetchContent();
            fetchStats();
        } catch (error: any) {
            console.error("Upload failed", error);
            alert(error.message || "Upload failed");
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleShare = async (action: 'email' | 'link') => {
        if (!selectedFile) return;
        try {
            const res = await axios.post("/api/share", {
                fileId: selectedFile._id,
                email: action === 'email' ? shareEmail : undefined,
                action: action === 'email' ? 'share_email' : 'generate_link'
            });

            if (action === 'link') {
                setShareLink(res.data.link);
            } else {
                alert("Shared successfully!");
                setShareEmail("");
            }
        } catch (error) {
            alert("Share failed");
        }
    };

    const handleContextMenu = (e: React.MouseEvent, file: any) => {
        e.preventDefault();
        setSelectedFile(file);
        setContextMenu({ x: e.pageX, y: e.pageY });
    };

    const handleStar = async () => {
        if (!selectedFile) return;
        try {
            // Toggle star
            const newStatus = !selectedFile.isStarred;
            await axios.put(`/api/file/${selectedFile._id}`, { isStarred: newStatus });
            fetchContent();
        } catch (error) {
            alert("Failed to star");
        }
    };

    const handleRename = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;
        try {
            await axios.put(`/api/file/${selectedFile._id}`, { name: renameValue });
            setShowRenameModal(false);
            fetchContent();
        } catch (error) {
            alert("Rename failed");
        }
    };

    const deleteFile = async (fileId: string) => {
        if (!confirm("Are you sure you want to move this to trash?")) return;
        try {
            await axios.put(`/api/file/${fileId}`, { isTrash: true });
            fetchContent(); // Refresh
        } catch (error) {
            alert("Failed to delete file");
        }
    };

    const handleDrag = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Icon helper
    const getFileIcon = (mime: string) => {
        if (mime.includes('image')) return <Image className="text-purple-500" />;
        if (mime.includes('video')) return <Video className="text-pink-500" />;
        if (mime.includes('audio')) return <Music className="text-green-500" />;
        if (mime.includes('pdf')) return <FileText className="text-red-500" />;
        if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return <Archive className="text-amber-500" />;
        return <FileIcon className="text-blue-500" />;
    };

    // NEW: Filter files by type
    const filterFiles = (filesArray: any[]) => {
        if (fileTypeFilter === "all") return filesArray;
        return filesArray.filter(f => {
            const mime = f.mimeType?.toLowerCase() || "";
            switch (fileTypeFilter) {
                case "images": return mime.startsWith("image/");
                case "videos": return mime.startsWith("video/");
                case "audio": return mime.startsWith("audio/");
                case "documents": return mime.includes("pdf") || mime.includes("doc") || mime.includes("text");
                case "archives": return mime.includes("zip") || mime.includes("rar") || mime.includes("tar") || mime.includes("7z");
                default: return true;
            }
        });
    };

    // NEW: Sort files
    const sortFiles = (filesArray: any[]) => {
        return [...filesArray].sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "name":
                    comparison = a.name.localeCompare(b.name);
                    break;
                case "size":
                    comparison = (a.size || 0) - (b.size || 0);
                    break;
                case "date":
                default:
                    comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });
    };

    // NEW: Get filtered and sorted files
    const displayedFiles = sortFiles(filterFiles(files));

    // NEW: Toggle file selection
    const toggleFileSelection = (fileId: string) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(fileId)) {
            newSelected.delete(fileId);
        } else {
            newSelected.add(fileId);
        }
        setSelectedFiles(newSelected);
    };

    // NEW: Select all/deselect all
    const toggleSelectAll = () => {
        if (selectedFiles.size === displayedFiles.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(displayedFiles.map(f => f._id)));
        }
    };

    // NEW: Bulk download
    const handleBulkDownload = async () => {
        if (selectedFiles.size === 0) return;
        for (const fileId of Array.from(selectedFiles)) {
            window.open(`/api/file/${fileId}`, "_blank");
        }
    };

    // NEW: Get preview URL (use Google Drive viewer for better compatibility)
    const getPreviewUrl = (file: any) => {
        if (file.googleFileId) {
            // Use Google Drive's preview/view link for better cross-origin compatibility
            return `https://drive.google.com/file/d/${file.googleFileId}/preview`;
        }
        return `/api/file/${file._id}`;
    };

    if (status === "loading") return <div className="flex h-screen items-center justify-center">Loading...</div>;

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar (Glassmorphism) */}
            <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl hidden md:flex flex-col z-20">
                <div className="p-6">
                    <Link href="/dashboard">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">D</div>
                            <h1 className="text-xl font-bold tracking-tight">DM-Drive</h1>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {[
                        { href: "/dashboard", icon: Folder, label: "My Drive" },
                        { href: "/dashboard/starred", icon: Star, label: "Starred" },
                        { href: "/dashboard/recent", icon: Search, label: "Recent" },
                        { href: "/dashboard/trash", icon: Trash2, label: "Trash" },
                        { href: "/settings", icon: Settings, label: "Settings" },
                    ].map((item) => (
                        <Link key={item.href} href={item.href} className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all">
                            <item.icon className="w-4 h-4 mr-3" /> {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Storage</span>
                        <span>{Math.round((stats.used / stats.limit) * 100)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((stats.used / stats.limit) * 100, 100)}%` }}
                            className="bg-primary h-full rounded-full"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {(stats.used / 1024 / 1024 / 1024).toFixed(1)} GB used
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative bg-muted/20" onDragEnter={handleDrag}>
                {/* Drag Overlay */}
                {dragActive && (
                    <div
                        className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-2 border-primary border-dashed m-4 rounded-xl flex flex-col items-center justify-center"
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleUpload}
                    >
                        <Upload className="w-16 h-16 text-primary mb-4 animate-bounce" />
                        <p className="text-2xl font-bold text-primary">Drop to Upload</p>
                    </div>
                )}

                {/* Header */}
                <header className="min-h-14 sm:h-16 border-b border-border bg-background/80 backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center justify-between px-4 sm:px-6 py-2 sm:py-0 z-10 gap-2">
                    <div className="flex items-center bg-secondary/50 focus-within:bg-secondary transition-colors rounded-xl px-3 sm:px-4 py-2 flex-1 sm:flex-none sm:w-64 md:w-80 lg:w-96 order-2 sm:order-1">
                        <Search className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2">
                        <button onClick={() => setShowFolderModal(true)} className="px-2 sm:px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors hidden sm:block">
                            New Folder
                        </button>
                        <button onClick={() => setShowFolderModal(true)} className="p-2 text-foreground hover:bg-secondary rounded-lg transition-colors sm:hidden">
                            <Folder className="w-5 h-5" />
                        </button>
                        <label className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all transform active:scale-95">
                            <Upload className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload"}</span>
                            <input type="file" className="hidden" onChange={handleUpload} />
                        </label>
                        {/* Profile Menu */}
                        <div className="relative hidden sm:block">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}
                                className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 ring-2 ring-background flex items-center justify-center text-white font-semibold text-sm hover:ring-primary transition-all"
                            >
                                {session?.user?.name?.charAt(0).toUpperCase() || session?.user?.email?.charAt(0).toUpperCase() || "U"}
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg py-2 z-50">
                                    <div className="px-4 py-2 border-b border-border">
                                        <p className="font-medium text-foreground truncate">{session?.user?.name || "User"}</p>
                                        <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                                    </div>
                                    <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                                        <Settings className="w-4 h-4" /> Settings
                                    </Link>
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/login" })}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Upload Progress Bar */}
                {uploading && (
                    <div className="px-6 py-3 bg-background border-b border-border">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Uploading...</span>
                            <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-primary h-full rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* NEW: Filter/Sort/Bulk Toolbar */}
                <div className="px-3 sm:px-6 py-2 sm:py-3 bg-background/80 backdrop-blur-sm border-b border-border overflow-x-auto">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-max">
                        {/* File Type Filter */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
                            <select
                                value={fileTypeFilter}
                                onChange={(e) => setFileTypeFilter(e.target.value)}
                                className="bg-secondary text-foreground text-xs sm:text-sm rounded-lg px-2 sm:px-3 py-1.5 border-none outline-none cursor-pointer"
                            >
                                <option value="all">All</option>
                                <option value="images">Images</option>
                                <option value="videos">Videos</option>
                                <option value="audio">Audio</option>
                                <option value="documents">Docs</option>
                                <option value="archives">Archives</option>
                            </select>
                        </div>

                        {/* Sort Options */}
                        <div className="flex items-center gap-1 sm:gap-2">
                            <ArrowUpDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-secondary text-foreground text-xs sm:text-sm rounded-lg px-2 sm:px-3 py-1.5 border-none outline-none cursor-pointer"
                            >
                                <option value="date">Date</option>
                                <option value="name">Name</option>
                                <option value="size">Size</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                className="px-2 py-1.5 text-xs bg-secondary rounded-lg hover:bg-secondary/80"
                            >
                                {sortOrder === "asc" ? "↑" : "↓"}
                            </button>
                        </div>

                        <div className="flex-1 min-w-[20px]" />

                        {/* Bulk Actions */}
                        {selectedFiles.size > 0 && (
                            <div className="flex items-center gap-1 sm:gap-2 animate-fade-in">
                                <span className="text-xs sm:text-sm text-muted-foreground">{selectedFiles.size}</span>
                                <button
                                    onClick={handleBulkDownload}
                                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm hover:bg-primary/90"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Download</span>
                                </button>
                                <button
                                    onClick={() => setSelectedFiles(new Set())}
                                    className="p-1.5 hover:bg-secondary rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Select All Toggle */}
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center gap-1 px-2 py-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
                        >
                            {selectedFiles.size === displayedFiles.length && displayedFiles.length > 0 ? (
                                <CheckSquare className="w-4 h-4" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">All</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-4 sm:p-8 overflow-y-auto pb-24 md:pb-8">
                    {/* Breadcrumb / Navigation */}
                    {currentFolder && (
                        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors" onClick={navigateUp}>
                            <span className="p-1 rounded-md hover:bg-secondary">← Back</span>
                        </div>
                    )}

                    {/* Folders Grid */}
                    {folders.length > 0 && (
                        <div className="mb-10">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Folders</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {folders.map((folder) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={folder._id}
                                        onDoubleClick={() => setCurrentFolder(folder._id)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setSelectedFolder(folder);
                                            setFolderContextMenu({ x: e.pageX, y: e.pageY });
                                        }}
                                        className="group bg-card hover:bg-accent p-4 rounded-xl border border-border cursor-pointer flex flex-col items-center justify-center transition-all hover:scale-[1.02] active:scale-95 relative"
                                    >
                                        <Folder className="w-12 h-12 text-blue-500/80 mb-3 fill-current group-hover:text-blue-500 transition-colors" />
                                        <p className="text-sm font-medium truncate w-full text-center text-card-foreground">{folder.name}</p>
                                        {/* More options button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFolder(folder);
                                                setFolderContextMenu({ x: e.pageX, y: e.pageY });
                                            }}
                                            className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
                                        >
                                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Files Grid */}
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Files {fileTypeFilter !== "all" && `(${fileTypeFilter})`}
                    </h2>
                    {displayedFiles.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <FileIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>No files found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {displayedFiles.map((file, i) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.02 }}
                                    key={file._id}
                                    onContextMenu={(e) => handleContextMenu(e, file)}
                                    className={`group relative bg-card rounded-xl border hover:shadow-lg transition-all overflow-hidden ${selectedFiles.has(file._id) ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    {/* Selection Checkbox */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleFileSelection(file._id); }}
                                        className={`absolute top-2 right-2 z-20 p-1 rounded-md transition-all ${selectedFiles.has(file._id)
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-black/50 text-white opacity-0 group-hover:opacity-100"
                                            }`}
                                    >
                                        {selectedFiles.has(file._id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                    </button>

                                    <div className="aspect-square bg-secondary/30 relative flex items-center justify-center group-hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => setPreviewFile(file)}>
                                        {file.isStarred && <Star className="absolute top-2 left-2 w-4 h-4 text-amber-500 fill-amber-500 z-10" />}

                                        {file.mimeType?.includes("image") ? (
                                            <img src={`/api/file/${file._id}/thumbnail?size=400`} alt={file.name} loading="lazy" className="object-cover w-full h-full hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        ) : (
                                            <div className="p-4 rounded-full bg-background shadow-sm">
                                                {getFileIcon(file.mimeType || "")}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium truncate flex-1 pr-2" title={file.name}>{file.name}</p>
                                            <MoreVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleContextMenu(e, file); }} />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Empty State - Only when no files AND no folders */}
                    {files.length === 0 && folders.length === 0 && !searchQuery && (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                            <div className="w-20 h-20 rounded-full bg-secondary mb-4 flex items-center justify-center">
                                <LayoutGrid className="w-10 h-10" />
                            </div>
                            <p>Nothing here yet</p>
                        </div>
                    )}
                </div>

                {/* Modals & Context Menu remain functionally largely same, but verify styling in future steps if needed. 
                    Re-using existing modal logic blocks below for simplicity but wrapping in modern styles where possible via global classes.
                */}

                {/* ... (Existing Modal Logic: Folder, Share, Preview, Rename) ... */}
                {/* Re-inserting updated modals for style consistency */}

                {showFolderModal && (
                    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card p-6 rounded-xl w-full max-w-sm border border-border shadow-2xl">
                            <h3 className="text-lg font-bold mb-4">New Folder</h3>
                            <form onSubmit={handleCreateFolder}>
                                <input
                                    className="w-full bg-secondary border-none rounded-lg px-4 py-2 mb-4 focus:ring-2 ring-primary outline-none"
                                    placeholder="Folder Name"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors">Cancel</button>
                                    <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Create</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* ... (Other Modals) ... */}
                {showShareModal && (
                    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-md p-6 rounded-xl border border-border shadow-2xl">
                            <h3 className="text-lg font-bold mb-4 flex items-center border-b border-border pb-2">
                                <Share2 className="w-5 h-5 mr-2 text-primary" /> Share File
                            </h3>
                            {/* ... Share UI ... */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Email Invite</label>
                                    <div className="flex gap-2 mt-1">
                                        <input
                                            className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-primary"
                                            placeholder="friend@example.com"
                                            value={shareEmail}
                                            onChange={(e) => setShareEmail(e.target.value)}
                                        />
                                        <button onClick={() => handleShare('email')} className="bg-primary text-primary-foreground px-4 rounded-lg text-sm font-medium">Send</button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted-foreground">Public Link</label>
                                    <div className="flex gap-2 mt-1">
                                        <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm truncate font-mono text-muted-foreground">
                                            {shareLink || "No link generated"}
                                        </div>
                                        <button onClick={() => handleShare('link')} className="bg-secondary hover:bg-secondary/80 text-foreground px-4 rounded-lg text-sm font-medium border border-border">Generate</button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button onClick={() => setShowShareModal(false)} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* NEW: Advanced Share Modal */}
                {showAdvancedShare && selectedFile && (
                    <ShareModal file={selectedFile} onClose={() => setShowAdvancedShare(false)} />
                )}

                {previewFile && (
                    <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
                        <button onClick={() => setPreviewFile(null)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors z-50">
                            <X className="w-6 h-6" />
                        </button>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-6xl h-[85vh] flex items-center justify-center relative">
                            {previewFile.mimeType?.includes("image") ? (
                                <img src={`/api/file/${previewFile._id}/thumbnail?size=1200`} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" alt={previewFile.name} onError={(e) => { (e.target as HTMLImageElement).src = `/api/file/${previewFile._id}`; }} />
                            ) : (previewFile.mimeType?.includes("video") || previewFile.mimeType?.includes("pdf")) && previewFile.googleFileId ? (
                                <iframe
                                    src={`https://drive.google.com/file/d/${previewFile.googleFileId}/preview`}
                                    className="w-full h-full rounded-lg shadow-2xl"
                                    allow="autoplay; fullscreen"
                                />
                            ) : previewFile.mimeType?.includes("video") ? (
                                <video src={`/api/file/${previewFile._id}`} controls autoPlay className="max-w-full max-h-full shadow-2xl rounded-lg" />
                            ) : previewFile.mimeType?.includes("audio") ? (
                                <div className="text-center">
                                    <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-8 mx-auto">
                                        <Music className="w-16 h-16 text-white" />
                                    </div>
                                    <audio src={`/api/file/${previewFile._id}`} controls autoPlay className="w-full max-w-md" />
                                </div>
                            ) : (
                                <div className="text-center text-white">
                                    <FileIcon className="w-24 h-24 mx-auto mb-6 opacity-50" />
                                    <p className="text-2xl font-light mb-8">{previewFile.name}</p>
                                    <a href={`/api/file/${previewFile._id}`} className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:scale-105 transition-transform inline-block">Download File</a>
                                </div>
                            )}
                        </motion.div>
                        <p className="text-white/50 mt-4 text-sm font-mono">{previewFile.name}</p>
                    </div>
                )}

                {/* Context Menu (Styled) */}
                {contextMenu && selectedFile && (
                    <div
                        className="fixed z-[100] bg-popover text-popover-foreground border border-border rounded-lg shadow-lg py-1 w-56 animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        {[
                            { label: "Preview", icon: Eye, action: () => setPreviewFile(selectedFile) },
                            { label: "Rename", icon: Edit2, action: () => { setRenameValue(selectedFile.name); setShowRenameModal(true); } },
                            { label: selectedFile.isStarred ? "Unstar" : "Star", icon: Star, action: handleStar, className: selectedFile.isStarred ? "text-amber-500" : "" },
                            { label: "Quick Share", icon: Share2, action: () => setShowShareModal(true) },
                            { label: "Advanced Share", icon: Share2, action: () => setShowAdvancedShare(true), className: "text-primary" },
                            { separator: true },
                            { label: "Delete", icon: Trash2, action: () => deleteFile(selectedFile._id), className: "text-destructive hover:bg-destructive/10" }
                        ].map((item, i) => (
                            item.separator ? <div key={i} className="h-px bg-border my-1" /> :
                                <button
                                    key={i}
                                    onClick={() => { item.action?.(); setContextMenu(null); }}
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center hover:bg-secondary transition-colors ${item.className || ""}`}
                                >
                                    {item.icon && <item.icon className="w-4 h-4 mr-3" />} {item.label}
                                </button>
                        ))}
                    </div>
                )}

                {/* Rename Modal (Styled) */}
                {showRenameModal && (
                    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card p-6 rounded-xl w-96 border border-border shadow-2xl">
                            <h3 className="text-lg font-bold mb-4">Rename</h3>
                            <form onSubmit={handleRename}>
                                <input
                                    className="w-full bg-secondary border-none rounded-lg px-4 py-2 mb-4 focus:ring-2 ring-primary outline-none"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowRenameModal(false)} className="px-4 py-2 text-sm hover:bg-secondary rounded-lg">Cancel</button>
                                    <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">Save</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Folder Context Menu */}
                {folderContextMenu && selectedFolder && (
                    <div
                        className="fixed z-[100] bg-popover text-popover-foreground border border-border rounded-lg shadow-lg py-1 w-48 animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: folderContextMenu.y, left: folderContextMenu.x }}
                    >
                        <button
                            onClick={() => { setCurrentFolder(selectedFolder._id); setFolderContextMenu(null); }}
                            className="w-full text-left px-3 py-2 text-sm flex items-center hover:bg-secondary transition-colors"
                        >
                            <Folder className="w-4 h-4 mr-3" /> Open
                        </button>
                        <button
                            onClick={() => { setShowFolderShare(true); setFolderContextMenu(null); }}
                            className="w-full text-left px-3 py-2 text-sm flex items-center hover:bg-secondary transition-colors text-primary"
                        >
                            <Share2 className="w-4 h-4 mr-3" /> Share Folder
                        </button>
                        <div className="h-px bg-border my-1" />
                        <button
                            onClick={async () => {
                                if (!confirm("Move this folder to trash?")) return;
                                try {
                                    await axios.put(`/api/folders/${selectedFolder._id}`, { isTrash: true });
                                    fetchContent();
                                } catch { alert("Failed to delete folder"); }
                                setFolderContextMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm flex items-center hover:bg-destructive/10 transition-colors text-destructive"
                        >
                            <Trash2 className="w-4 h-4 mr-3" /> Delete
                        </button>
                    </div>
                )}

                {/* Folder Share Modal */}
                {showFolderShare && selectedFolder && (
                    <ShareModal file={selectedFolder} isFolder={true} onClose={() => setShowFolderShare(false)} />
                )}
            </main >

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
                    <motion.div
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        className="w-64 h-full border-r border-border bg-card flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">T</div>
                                    <h1 className="text-xl font-bold tracking-tight">DM-Drive</h1>
                                </div>
                            </Link>
                        </div>

                        <nav className="flex-1 px-4 space-y-1">
                            {[
                                { href: "/dashboard", icon: Folder, label: "My Drive" },
                                { href: "/dashboard/starred", icon: Star, label: "Starred" },
                                { href: "/dashboard/recent", icon: Search, label: "Recent" },
                                { href: "/dashboard/trash", icon: Trash2, label: "Trash" },
                                { href: "/settings", icon: Settings, label: "Settings" },
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all"
                                >
                                    <item.icon className="w-4 h-4 mr-3" /> {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="p-4 border-t border-border">
                            <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
                                <span>Storage</span>
                                <span>{Math.round((stats.used / stats.limit) * 100)}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-primary h-full rounded-full"
                                    style={{ width: `${Math.min((stats.used / stats.limit) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {(stats.used / 1024 / 1024 / 1024).toFixed(1)} GB used
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Mobile Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-card/95 backdrop-blur-xl border-t border-border">
                <div className="flex items-center justify-around py-2">
                    <Link href="/dashboard" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
                        <Folder className="w-5 h-5" />
                        <span className="text-xs font-medium">Drive</span>
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
        </div >
    );
}

