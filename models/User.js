import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this user.'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email for this user.'],
        unique: true,
    },
    password: {
        type: String,
        select: false,
    },
    image: {
        type: String,
    },
    storageUsed: {
        type: Number,
        default: 0,
    },
    storageLimit: {
        type: Number,
        default: 5 * 1024 * 1024 * 1024, // 5GB
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Note: email index is automatically created by unique:true

export default mongoose.models.User || mongoose.model('User', UserSchema);
