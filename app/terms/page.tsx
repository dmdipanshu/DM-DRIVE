"use client";

import Link from "next/link";
import { Cloud, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsPage() {
    return (
        <div className="min-h-screen mesh-gradient flex flex-col overflow-hidden">
            {/* Floating decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-[10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-[10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
            </div>

            {/* Header */}
            <header className="relative z-10 px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-white">
                            DM-Drive
                        </span>
                    </Link>
                </div>
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
            </header>

            {/* Content */}
            <main className="relative z-10 flex-1 px-4 sm:px-6 py-8 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="glass-dark p-6 sm:p-10 rounded-3xl">
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Terms of Service</h1>
                        <p className="text-white/50 text-sm mb-8">Last updated: January 17, 2026</p>

                        <div className="space-y-8 text-white/70 leading-relaxed">
                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                                <p>
                                    By accessing and using DM-Drive, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
                                <p>
                                    DM-Drive provides cloud storage services powered by Google Drive. Users can upload, store, share, and manage files through our platform. We offer 5GB of free storage for all users.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
                                <p className="mb-3">When creating an account, you agree to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Provide accurate and complete information</li>
                                    <li>Maintain the security of your account credentials</li>
                                    <li>Accept responsibility for all activities under your account</li>
                                    <li>Notify us immediately of any unauthorized use</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
                                <p className="mb-3">You agree not to use DM-Drive to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Upload, share, or store illegal content</li>
                                    <li>Distribute malware or harmful software</li>
                                    <li>Violate intellectual property rights</li>
                                    <li>Harass, abuse, or harm other users</li>
                                    <li>Attempt to gain unauthorized access to our systems</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">5. Content Ownership</h2>
                                <p>
                                    You retain all ownership rights to the content you upload to DM-Drive. By uploading content, you grant us a limited license to store, process, and transmit your files as necessary to provide the service.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">6. Storage Limits</h2>
                                <p>
                                    Each user is allocated 5GB of storage space. We reserve the right to modify storage limits with prior notice. Exceeding your storage limit may result in restricted upload capabilities.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">7. Service Availability</h2>
                                <p>
                                    While we strive to maintain high availability, we do not guarantee uninterrupted access to DM-Drive. The service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">8. Termination</h2>
                                <p>
                                    We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, your right to use the service ceases immediately, and we may delete your stored content.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
                                <p>
                                    DM-Drive is provided &quot;as is&quot; without warranties of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">10. Changes to Terms</h2>
                                <p>
                                    We may update these terms from time to time. Continued use of DM-Drive after changes constitutes acceptance of the new terms. We encourage you to review this page periodically.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">11. Contact</h2>
                                <p>
                                    If you have any questions about these Terms of Service, please contact us through our support channels.
                                </p>
                            </section>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-6 sm:py-8 text-center text-sm text-white/30">
                <div className="flex items-center justify-center gap-4 mb-2">
                    <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
                    <span>•</span>
                    <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
                </div>
                <p>&copy; {new Date().getFullYear()} DM-Drive. Powered by Google Drive.</p>
            </footer>
        </div>
    );
}
