"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle } from "lucide-react";

export default function RegisterClosedPage() {
    const [open, setOpen] = useState(true);
    const router = useRouter();

    // Auto close popup after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setOpen(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    // Redirect after popup closes
    useEffect(() => {
        if (!open) {
            const redirectTimer = setTimeout(() => {
                window.location.href = "https://dm-dipanshu.site";
            }, 400); // wait for exit animation
            return () => clearTimeout(redirectTimer);
        }
    }, [open]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black/90">
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 40 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="bg-zinc-900 border border-white/10 rounded-2xl p-8 w-[90%] max-w-md text-center shadow-2xl"
                    >
                        <div className="flex justify-center mb-4">
                            <XCircle className="w-14 h-14 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">
                            Registration Closed
                        </h1>

                        <p className="text-white/60 mb-6">
                            New registrations are currently unavailable.
                            Please check back later.
                        </p>

                        <button
                            onClick={() => setOpen(false)}
                            className="px-6 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition"
                        >
                            Go Back
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
