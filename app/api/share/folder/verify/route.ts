import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Folder from "@/models/Folder";
import File from "@/models/File";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { token, password, subfolderId } = await req.json();

        if (!token) {
            return new NextResponse("Token required", { status: 400 });
        }

        await dbConnect();

        // Find the root shared folder
        const rootFolder = await Folder.findOne({ publicToken: token });
        if (!rootFolder) {
            return NextResponse.json({ valid: false, error: "Folder not found" });
        }

        // Check expiration
        if (rootFolder.shareExpiry && new Date() > rootFolder.shareExpiry) {
            return NextResponse.json({ valid: false, error: "Link has expired" });
        }

        // Check password
        if (rootFolder.sharePassword) {
            if (!password) {
                return NextResponse.json({
                    valid: false,
                    requiresPassword: true,
                    error: "Password required"
                });
            }

            const isMatch = await bcrypt.compare(password, rootFolder.sharePassword);
            if (!isMatch) {
                return NextResponse.json({ valid: false, error: "Incorrect password" });
            }
        }

        // Determine which folder to list (root or subfolder)
        let targetFolderId = rootFolder._id;
        let currentFolder = rootFolder;

        if (subfolderId) {
            // Verify the subfolder exists
            const subfolder = await Folder.findById(subfolderId);
            if (!subfolder) {
                return NextResponse.json({ valid: false, error: "Subfolder not found" });
            }

            // SECURITY: Verify subfolder is actually inside the shared folder tree
            // by walking up the parent chain
            let checkFolder = subfolder;
            let isWithinSharedFolder = false;
            const maxDepth = 50; // Prevent infinite loops
            let depth = 0;

            while (checkFolder && depth < maxDepth) {
                if (checkFolder._id.toString() === rootFolder._id.toString()) {
                    isWithinSharedFolder = true;
                    break;
                }
                if (!checkFolder.parent) break;
                checkFolder = await Folder.findById(checkFolder.parent);
                depth++;
            }

            if (!isWithinSharedFolder) {
                return NextResponse.json({ valid: false, error: "Access denied" });
            }

            targetFolderId = subfolder._id;
            currentFolder = subfolder;
        }

        // Fetch contents of the target folder
        const [subfolders, files] = await Promise.all([
            Folder.find({ parent: targetFolderId, isTrash: false }).select('_id name color'),
            File.find({ parent: targetFolderId, isTrash: false }).select('_id name size mimeType googleFileId')
        ]);

        return NextResponse.json({
            valid: true,
            folder: {
                id: rootFolder._id,
                name: rootFolder.name,
                currentFolder: {
                    id: currentFolder._id,
                    name: currentFolder.name,
                    isRoot: currentFolder._id.toString() === rootFolder._id.toString()
                }
            },
            subfolders: subfolders.map(f => ({
                id: f._id,
                name: f.name,
                color: f.color
            })),
            files: files.map(f => ({
                id: f._id,
                name: f.name,
                size: f.size,
                mimeType: f.mimeType,
                googleFileId: f.googleFileId
            }))
        });

    } catch (error) {
        console.error("VERIFY_FOLDER_SHARE_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
