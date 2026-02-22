/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
        webpackBuildWorker: true,
    },
    // Increase static page generation timeout
    staticPageGenerationTimeout: 180,
    // Output standalone for easier deployment
    output: 'standalone',
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true }
};

module.exports = nextConfig;
