
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Initialize Auth
// Requires GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in .env
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const getAuthClient = () => {
    // PRIORITY 1: OAuth2 (User Credentials - Required for Personal Accounts with Quota)
    if (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID) {
        console.log("GOOGLE_AUTH: Using OAuth2 Refresh Token.");
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'https://developers.google.com/oauthplayground'
        );
        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });
        return oauth2Client;
    }

    // PRIORITY 2: Check for "service-account.json" file in project root
    // This is the easiest way for users (avoids .env formatting issues)
    try {
        const keyFilePath = path.join(process.cwd(), 'service-account.json');

        if (fs.existsSync(keyFilePath)) {
            console.log("GOOGLE_AUTH: Found 'service-account.json'. Using file-based auth.");
            return new google.auth.GoogleAuth({
                keyFile: keyFilePath,
                scopes: SCOPES,
            });
        }
    } catch (err) {
        console.warn("GOOGLE_AUTH: File check failed, falling back to .env", err);
    }

    // PRIORITY 3: Fallback to .env (Legacy Service Account)
    const email = process.env.GOOGLE_CLIENT_EMAIL;
    let key = process.env.GOOGLE_PRIVATE_KEY || "";
    key = key.replace(/\\n/g, '\n');

    if (!email || !key) {
        console.warn("GOOGLE_AUTH: Missing credentials in .env AND no service-account.json found.");
        // Don't throw immediately, let it fail meaningfully if used
    }

    // Basic Validation
    if (key && !key.includes("-----BEGIN PRIVATE KEY-----")) {
        // Attempt to fix common copy-paste error where headers are missing
        key = `-----BEGIN PRIVATE KEY-----\n${key.trim()}\n-----END PRIVATE KEY-----`;
    }

    console.log("GOOGLE_AUTH: Using Service Account .env credentials.");

    return new google.auth.JWT({
        email,
        key,
        scopes: SCOPES
    });
};

export async function uploadToDrive(fileStream: any, name: string, mimeType: string) {
    const auth = getAuthClient();
    const drive = google.drive({ version: 'v3', auth });

    // If it's a Buffer, convert to Stream (Legacy support)
    if (Buffer.isBuffer(fileStream)) {
        const bufferStream = new Readable();
        bufferStream.push(fileStream);
        bufferStream.push(null);
        fileStream = bufferStream;
    }

    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    console.log("DEBUG: Uploading to Parent Folder ID:", rootFolderId || "UNDEFINED (Will fail)");

    const response = await drive.files.create({
        requestBody: {
            name,
            mimeType,
            parents: rootFolderId ? [rootFolderId] : undefined
        },
        media: {
            mimeType,
            body: fileStream // Support Readable Stream directly
        },
        supportsAllDrives: true
    });

    return response.data; // Contains .id, .name, etc.
}

/**
 * Initiates a resumable upload session on Google Drive.
 * Returns the resumable upload URI that the client can PUT the file to directly.
 */
export async function initResumableUpload(name: string, mimeType: string, fileSize: number) {
    const auth = getAuthClient();
    const accessToken = await getDriveAccessToken();
    if (!accessToken) {
        throw new Error("Failed to obtain Google Drive access token");
    }

    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    // Create resumable upload session via Google Drive API
    const metadata = {
        name,
        mimeType,
        parents: rootFolderId ? [rootFolderId] : undefined,
    };

    const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Upload-Content-Type': mimeType,
                'X-Upload-Content-Length': fileSize.toString(),
            },
            body: JSON.stringify(metadata),
        }
    );

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to init resumable upload: ${res.status} ${errText}`);
    }

    const uploadUrl = res.headers.get('Location');
    if (!uploadUrl) {
        throw new Error('Google Drive did not return a resumable upload URL');
    }

    return { uploadUrl, accessToken };
}

export async function getDriveAccessToken() {
    const auth = getAuthClient();
    const tokenResponse = await auth.getAccessToken();
    // Helper to safely extract token string regardless of return type
    if (!tokenResponse) {
        return undefined;
    }
    if (typeof tokenResponse === 'string') {
        return tokenResponse;
    }
    return tokenResponse.token || undefined;
}

export async function deleteFromDrive(fileId: string) {
    const auth = getAuthClient();
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.delete({
        fileId,
        supportsAllDrives: true
    });
}
