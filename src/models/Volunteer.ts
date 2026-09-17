import mongoose, { Schema, Document } from 'mongoose';

export interface IVolunteer extends Document {
  userId?: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  vehicleType: string;
  serviceCity: string;
  availability: string;
  emergencyContact: string;
  profilePicUrl: string;
  badgeLevel: string;
  totalRescues: number;
  totalHours: number;
  rating: number;
  createdAt: Date;
}

const VolunteerSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  bio: { type: String, default: '' },
  vehicleType: { type: String, default: 'Electric Vehicle / Bike' },
  serviceCity: { type: String, default: 'Central District' },
  availability: { type: String, default: 'Weekdays & Evenings' },
  emergencyContact: { type: String, default: '' },
  profilePicUrl: { type: String, default: '' },
  badgeLevel: { type: String, default: 'Rescue Captain' },
  totalRescues: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  createdAt: { type: Date, default: Date.now }
});

export const Volunteer = mongoose.models.Volunteer || mongoose.model<IVolunteer>('Volunteer', VolunteerSchema);
