export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
            <div className="w-full max-w-md space-y-8 relative">
                <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-purple-500 to-pink-500 opacity-20 blur-[100px] rounded-full"></div>
                {children}
            </div>
        </div>
    );
}
