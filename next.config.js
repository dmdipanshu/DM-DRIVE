/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
        webpackBuildWorker: false,
    },
    // Increase static page generation timeout
    staticPageGenerationTimeout: 180,
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true }
};

module.exports = nextConfig;
