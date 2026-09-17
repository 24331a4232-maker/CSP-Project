import mongoose, { Schema, Document } from 'mongoose';

export interface IDonation extends Document {
  title: string;
  foodType: string;
  quantity: string;
  servings: number;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  pickupAddress: string;
  pickupTime: string;
  expiryTime: string;
  status: 'available' | 'collected' | 'delivered' | 'cancelled';
  volunteerName?: string;
  volunteerPhone?: string;
  deliveryProofUrl?: string;
  deliveryNote?: string;
  imageUrl?: string;
  urgency: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema: Schema = new Schema({
  title: { type: String, required: true },
  foodType: { type: String, required: true },
  quantity: { type: String, required: true },
  servings: { type: Number, required: true, default: 10 },
  donorName: { type: String, required: true },
  donorPhone: { type: String, required: true },
  donorEmail: { type: String, required: true },
  pickupAddress: { type: String, required: true },
  pickupTime: { type: String, required: true },
  expiryTime: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['available', 'collected', 'delivered', 'cancelled'], 
    default: 'available' 
  },
  volunteerName: { type: String, default: '' },
  volunteerPhone: { type: String, default: '' },
  deliveryProofUrl: { type: String, default: '' },
  deliveryNote: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  urgency: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Donation = mongoose.models.Donation || mongoose.model<IDonation>('Donation', DonationSchema);
