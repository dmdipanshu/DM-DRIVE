import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null, // Null means root directory
    },
    color: {
        type: String,
        default: '#5f6368', // Google Drive default gray
    },
    isTrash: {
        type: Boolean,
        default: false,
    },
    // Sharing fields
    sharedWith: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permission: { type: String, enum: ['viewer', 'editor'], default: 'viewer' }
    }],
    publicToken: {
        type: String,
        default: null
    },
    sharePassword: {
        type: String,
        default: null
    },
    shareExpiry: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes
FolderSchema.index({ owner: 1, parent: 1, isTrash: 1 });
FolderSchema.index({ publicToken: 1 });

export default mongoose.models.Folder || mongoose.model('Folder', FolderSchema);

