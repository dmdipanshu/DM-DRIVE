"use client";

import Link from "next/link";
import { Cloud, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
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
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
                        <p className="text-white/50 text-sm mb-8">Last updated: January 17, 2026</p>

                        <div className="space-y-8 text-white/70 leading-relaxed">
                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
                                <p>
                                    Welcome to DM-Drive. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our cloud storage service.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
                                <p className="mb-3">We collect the following types of information:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong className="text-white">Account Information:</strong> Name, email address, and password when you create an account</li>
                                    <li><strong className="text-white">Files and Content:</strong> Files you upload, including metadata such as file names, sizes, and types</li>
                                    <li><strong className="text-white">Usage Data:</strong> Information about how you interact with our service, including access times and features used</li>
                                    <li><strong className="text-white">Device Information:</strong> Browser type, IP address, and device identifiers</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
                                <p className="mb-3">We use your information to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Provide, maintain, and improve our cloud storage service</li>
                                    <li>Process your file uploads and downloads</li>
                                    <li>Send you service-related notifications</li>
                                    <li>Ensure the security of your account and data</li>
                                    <li>Analyze usage patterns to enhance user experience</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage</h2>
                                <p>
                                    Your files are stored securely using Google Drive infrastructure, which employs industry-leading security measures including encryption at rest and in transit. We use MongoDB to store account information and file metadata.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">5. Data Sharing</h2>
                                <p className="mb-3">We do not sell your personal information. We may share your data only in the following circumstances:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>With your consent when you share files with others</li>
                                    <li>With service providers who assist in operating our platform (e.g., Google Drive)</li>
                                    <li>When required by law or to protect our legal rights</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">6. Data Security</h2>
                                <p>
                                    We implement robust security measures to protect your data, including secure password hashing, HTTPS encryption, and secure session management. However, no method of transmission over the Internet is 100% secure.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
                                <p className="mb-3">You have the right to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Access and download your personal data</li>
                                    <li>Correct inaccurate information</li>
                                    <li>Delete your account and associated data</li>
                                    <li>Object to certain data processing activities</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">8. Cookies</h2>
                                <p>
                                    We use essential cookies for authentication and session management. These cookies are necessary for the proper functioning of our service and cannot be disabled.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">9. Data Retention</h2>
                                <p>
                                    We retain your data for as long as your account is active. If you delete your account, we will remove your personal information and files within 30 days, unless we are required by law to retain it longer.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">10. Children&apos;s Privacy</h2>
                                <p>
                                    DM-Drive is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">11. Changes to This Policy</h2>
                                <p>
                                    We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-white mb-3">12. Contact Us</h2>
                                <p>
                                    If you have any questions about this Privacy Policy or our data practices, please contact us through our support channels.
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
