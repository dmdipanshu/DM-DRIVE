"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Cloud, Lock, Zap, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/dashboard");
        }
    }, [status, router]);

    return (
        <div className="min-h-screen mesh-gradient flex flex-col overflow-hidden">
            {/* Floating decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-[10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-[10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="relative z-10 px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-white">
                        DM-Drive
                    </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-2"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/register"
                        className="bg-white text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all active:scale-95"
                    >
                        Get Started
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="max-w-4xl space-y-6"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 glass-dark rounded-full text-sm">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-white/80">Free 5GB Cloud Storage</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                        Store everything.
                        <br />
                        <span className="gradient-text">Limit nothing.</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                        DM-Drive provides secure, fast cloud storage powered by Google Drive. Upload, share, and access your files from anywhere.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
                        >
                            Start Uploading
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/login"
                            className="w-full sm:w-auto glass-dark px-8 py-4 rounded-2xl text-lg font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                        >
                            Sign In
                        </Link>
                    </div>
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.7 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-16 sm:mt-24 max-w-5xl w-full"
                >
                    <FeatureCard
                        icon={<Cloud className="w-6 h-6 text-blue-400" />}
                        title="Google Drive Storage"
                        description="Your files are stored securely in Google Drive with enterprise-grade reliability."
                        delay={0}
                    />
                    <FeatureCard
                        icon={<Shield className="w-6 h-6 text-green-400" />}
                        title="Secure & Private"
                        description="Password-protected sharing and encrypted transfers keep your data safe."
                        delay={0.1}
                    />
                    <FeatureCard
                        icon={<Zap className="w-6 h-6 text-amber-400" />}
                        title="Lightning Fast"
                        description="Global CDN delivery ensures fast downloads from anywhere in the world."
                        delay={0.2}
                    />
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-6 sm:py-8 text-center text-sm text-white/30">
                <p>&copy; {new Date().getFullYear()} DM-Drive. Powered by Google Drive.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description, delay }: { icon: any; title: string; description: string; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + delay }}
            className="glass-dark p-6 rounded-2xl text-left hover:bg-white/10 transition-all duration-300 group"
        >
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{description}</p>
        </motion.div>
    );
}
