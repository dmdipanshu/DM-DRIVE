import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    mimeType: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
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
        default: null,
    },
    googleFileId: {
        type: String,
        required: true,
    },
    isStarred: {
        type: Boolean,
        default: false,
    },
    isTrash: {
        type: Boolean,
        default: false,
    },
    sharedWith: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permission: { type: String, enum: ['viewer', 'editor'], default: 'viewer' }
    }],
    // Public share token (null = not shared publicly)
    publicToken: {
        type: String,
        default: null
    },
    // Password-protected sharing (hashed)
    sharePassword: {
        type: String,
        default: null
    },
    // Link expiration (null = never expires)
    shareExpiry: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for performance
FileSchema.index({ owner: 1, parent: 1, isTrash: 1 });
FileSchema.index({ name: 'text' });
FileSchema.index({ publicToken: 1 });
FileSchema.index({ googleFileId: 1 });

export default mongoose.models.File || mongoose.model('File', FileSchema);
