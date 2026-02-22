// Cloudflare Worker: Google Drive Streaming Proxy
// With proper filename handling and preview support

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const fileId = url.pathname.split('/').pop();
        const driveToken = url.searchParams.get('dt');
        const fileName = url.searchParams.get('name'); // NEW: filename param
        const inline = url.searchParams.get('inline'); // NEW: for preview

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Range',
                }
            });
        }

        // Validate required parameters
        if (!fileId || !driveToken) {
            return new Response('Missing file ID or drive token', { status: 400 });
        }

        // Validate token (expiration and file ID check)
        const token = url.searchParams.get('token');
        if (!token) {
            return new Response('Missing token', { status: 401 });
        }

        try {
            const [payloadB64] = token.split('.');
            const payload = JSON.parse(atob(payloadB64));

            // Check expiration
            if (!payload.exp || Date.now() > payload.exp) {
                return new Response('Token expired', { status: 401 });
            }

            // Verify file ID matches token
            if (payload.fid !== fileId) {
                return new Response('Token file mismatch', { status: 403 });
            }
        } catch (e) {
            return new Response('Invalid token format', { status: 401 });
        }

        // Forward to Google Drive
        const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

        const headers = {
            'Authorization': `Bearer ${driveToken}`,
            'Accept': '*/*'
        };

        // Forward Range header for video seeking
        const range = request.headers.get('Range');
        if (range) headers['Range'] = range;

        try {
            const driveResponse = await fetch(driveUrl, { headers });

            if (!driveResponse.ok) {
                return new Response(`Drive API Error: ${driveResponse.status}`, {
                    status: driveResponse.status
                });
            }

            // Stream Response with CORS and proper headers
            const responseHeaders = new Headers(driveResponse.headers);
            responseHeaders.set('Access-Control-Allow-Origin', '*');

            // Set proper Content-Disposition to preserve filename
            if (fileName) {
                const disposition = inline === 'true' ? 'inline' : 'attachment';
                responseHeaders.set('Content-Disposition', `${disposition}; filename="${fileName}"`);
            }

            return new Response(driveResponse.body, {
                status: driveResponse.status,
                headers: responseHeaders
            });
        } catch (error) {
            return new Response(`Fetch Error: ${error.message}`, { status: 500 });
        }
    }
};
