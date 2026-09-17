import { Router, Request, Response } from 'express';
import { Volunteer } from '../models/Volunteer.js';
import { connectToDatabase } from '../db/mongo.js';

const router = Router();

let memoryVolunteerProfile = {
  fullName: 'Sarah Jenkins',
  email: 'sarah.jenkins@lastplate.org',
  phone: '+1 (555) 382-9102',
  bio: 'Dedicated food rescue captain working to eliminate urban hunger and curb food waste.',
  vehicleType: 'Insulated Electric SUV',
  serviceCity: 'Metropolis (Central & Bay Area)',
  availability: 'Evenings (4:00 PM - 9:00 PM), Weekend Mornings',
  emergencyContact: 'David Jenkins (+1 555-901-2234)',
  profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  badgeLevel: 'Senior Rescue Captain',
  totalRescues: 48,
  totalHours: 120,
  rating: 4.9
};

// GET /api/volunteers/profile
router.get('/profile', async (_req: Request, res: Response) => {
  try {
    const isConnected = await connectToDatabase();
    if (isConnected) {
      const vol = await Volunteer.findOne().sort({ createdAt: -1 });
      if (vol) return res.json({ profile: vol });
    }
    return res.json({ profile: memoryVolunteerProfile });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/volunteers/profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    const isConnected = await connectToDatabase();

    if (isConnected) {
      let vol = await Volunteer.findOne();
      if (!vol) {
        vol = new Volunteer(update);
      } else {
        Object.assign(vol, update);
      }
      await vol.save();
      return res.json({ message: 'Profile updated', profile: vol });
    } else {
      memoryVolunteerProfile = { ...memoryVolunteerProfile, ...update };
      return res.json({ message: 'Profile updated', profile: memoryVolunteerProfile });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
