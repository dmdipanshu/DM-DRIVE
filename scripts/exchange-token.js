const https = require('https');

const code = '4/0ASc3gC2GQSeRPe_kIkVAfzAWh4YcvHUltkbwPPhR1ZE0HSGclbcIBfxC_utvx2FlmTm-xg';
const clientId = '1034936924750-6tbgo8n8h95h8kjuusqlvgt32njnk1lc.apps.googleusercontent.com';
const clientSecret = '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';
const redirectUri = 'https://developers.google.com/oauthplayground';

const data = new URLSearchParams({
    code: code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
}).toString();

const options = {
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const result = JSON.parse(body);
        if (result.refresh_token) {
            console.log('\n=== SUCCESS ===');
            console.log('New Refresh Token:');
            console.log(result.refresh_token);
            console.log('\nUpdate your .env file with:');
            console.log(`GOOGLE_REFRESH_TOKEN="${result.refresh_token}"`);
        } else {
            console.log('Error:', result);
        }
    });
});

req.write(data);
req.end();
