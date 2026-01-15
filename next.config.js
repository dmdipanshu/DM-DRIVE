/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        }
    },
    // Increase static page generation timeout
    staticPageGenerationTimeout: 180,
    // Output standalone for easier deployment
    output: 'standalone',
};

module.exports = nextConfig;
