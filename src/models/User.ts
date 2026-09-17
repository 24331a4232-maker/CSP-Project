import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'donor' | 'volunteer' | 'admin';
  phone?: string;
  organization?: string;
  profilePicUrl?: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['donor', 'volunteer', 'admin'], default: 'donor' },
  phone: { type: String, default: '' },
  organization: { type: String, default: '' },
  profilePicUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
