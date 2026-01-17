import mongoose from 'mongoose';

const UrlSchema = new mongoose.Schema({
    shortCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    originalUrl: {
        type: String,
        required: true
    },
    clicks: {
        type: Number,
        default: 0
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Allow anonymous URLs
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Url || mongoose.model('Url', UrlSchema);
