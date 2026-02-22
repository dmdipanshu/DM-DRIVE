const { google } = require('googleapis');
const readline = require('readline');

// Instructions for User:
// 1. Run this script: node scripts/get-google-token.js
// 2. Paste your Client ID and Client Secret when asked.
// 3. Click the link to authorize.
// 4. Paste the code back here.
// 5. Copy the REFRESH TOKEN into your .env file.

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question) {
    return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
    console.log('\n--- Google Drive OAuth Token Generator ---\n');

    const clientId = await ask('Enter your GOOGLE_CLIENT_ID: ');
    const clientSecret = await ask('Enter your GOOGLE_CLIENT_SECRET: ');

    const oauth2Client = new google.auth.OAuth2(
        clientId.trim(),
        clientSecret.trim(),
        'https://developers.google.com/oauthplayground' // Redirect URI
    );

    const scopes = ['https://www.googleapis.com/auth/drive'];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // CRITICAL for Refresh Token
        scope: scopes,
        prompt: 'consent' // Forces refresh token generation
    });

    console.log('\nPlease verify yourself by clicking this URL:\n');
    console.log(url);
    console.log('\n1. Authorize the app.');
    console.log('2. You might see a warning "Google hasn\'t verified this app" -> Click Advanced -> Go to ... (unsafe).');
    console.log('3. Copy the "Authorization code" from the page.');
    console.log('4. Paste it below.\n');

    const code = await ask('Enter the Authorization Code: ');

    try {
        const { tokens } = await oauth2Client.getToken(code.trim());

        console.log('\nSUCCESS! Here is your Refresh Token:\n');
        console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
        console.log('\nAdd this line to your .env file, along with your ID and Secret.');

    } catch (error) {
        console.error('\nError retrieving access token:', error.message);
    } finally {
        rl.close();
    }
}

main();
