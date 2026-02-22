import Link from "next/link";
import { Link2, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6 opacity-50">
                    <Link2 className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Link Not Found</h1>
                <p className="text-white/60 mb-8">This shortened URL doesn't exist or has been deleted.</p>
                <Link
                    href="/url"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                >
                    <ArrowLeft className="w-5 h-5" /> Create a New Link
                </Link>
            </div>
        </div>
    );
}
