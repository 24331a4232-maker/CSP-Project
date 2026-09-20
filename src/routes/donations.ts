import { Router, Request, Response } from 'express';
import { Donation } from '../models/Donation.js';
import { connectToDatabase } from '../db/mongo.js';

const router = Router();

// Default seed items for instant rich viewing
const INITIAL_DONATIONS: any[] = [
  {
    id: 'don_101',
    title: 'Surplus Gourmet Banquet Trays',
    foodType: 'Cooked Hot Meals',
    quantity: '25 Trays (Approx 120 Servings)',
    servings: 120,
    donorName: 'Grand Hyatt Hotel & Convention Center',
    donorPhone: '+1 (555) 234-8901',
    donorEmail: 'catering@grandhyatt.com',
    pickupAddress: '777 Grand Boulevard, Downtown Plaza',
    pickupTime: 'Today by 10:30 PM',
    expiryTime: 'Tomorrow 2:00 PM',
    status: 'available',
    urgency: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'don_102',
    title: 'Artisanal Bakery & Fresh Pastry Box',
    foodType: 'Bakery & Bread',
    quantity: '15 Boxes (80 Servings)',
    servings: 80,
    donorName: 'Golden Wheat Artisanal Bakery',
    donorPhone: '+1 (555) 456-1122',
    donorEmail: 'contact@goldenwheat.com',
    pickupAddress: '142 Main Street, Arts District',
    pickupTime: 'Within 2 Hours',
    expiryTime: 'Tomorrow 8:00 PM',
    status: 'available',
    urgency: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'don_103',
    title: 'Organic Farm Fresh Produce & Salads',
    foodType: 'Produce & Veggies',
    quantity: '8 Crates (200 kg)',
    servings: 200,
    donorName: 'Green Earth Farmers Market',
    donorPhone: '+1 (555) 888-3344',
    donorEmail: 'organics@greenearth.org',
    pickupAddress: '55 Harvest Road, Valley Center',
    pickupTime: 'Today 5:00 PM - 8:00 PM',
    expiryTime: 'In 3 Days',
    status: 'collected',
    volunteerName: 'Sarah Jenkins (Rescue Captain)',
    volunteerPhone: '+1 (555) 382-9102',
    urgency: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date().toISOString()
  }
];

let memoryDonations: any[] = [];

// GET /api/donations (Get list with optional status/search filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, foodType, search } = req.query;
    const isConnected = await connectToDatabase();

    if (isConnected) {
      const query: any = {};
      if (status && status !== 'all') {
        query.status = status;
      }
      if (foodType && foodType !== 'all') {
        query.foodType = foodType;
      }
      if (search) {
        query.$or = [
          { title: { $regex: String(search), $options: 'i' } },
          { pickupAddress: { $regex: String(search), $options: 'i' } },
          { donorName: { $regex: String(search), $options: 'i' } }
        ];
      }

      const donations = await (Donation as any).find(query).sort({ createdAt: -1 });
      return res.json({ donations });
    } else {
      let filtered = [...memoryDonations];
      if (status && status !== 'all') {
        filtered = filtered.filter(d => d.status === status);
      }
      if (foodType && foodType !== 'all') {
        filtered = filtered.filter(d => d.foodType === foodType);
      }
      if (search) {
        const q = String(search).toLowerCase();
        filtered = filtered.filter(d => 
          d.title.toLowerCase().includes(q) || 
          d.pickupAddress.toLowerCase().includes(q) || 
          d.donorName.toLowerCase().includes(q)
        );
      }
      return res.json({ donations: filtered });
    }
  } catch (error: any) {
    console.error('Error fetching donations:', error);
    return res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// GET /api/donations/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isConnected = await connectToDatabase();

    if (isConnected) {
      const donation = await (Donation as any).findOne({ _id: id });
      if (!donation) return res.status(404).json({ error: 'Donation not found' });
      return res.json({ donation });
    } else {
      const item = memoryDonations.find(d => d.id === id || d._id === id);
      if (!item) return res.status(404).json({ error: 'Donation not found' });
      return res.json({ donation: item });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/donations (Create food donation)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title,
      foodType,
      quantity,
      servings,
      donorName,
      donorPhone,
      donorEmail,
      pickupAddress,
      pickupTime,
      expiryTime,
      imageUrl,
      urgency
    } = req.body;

    if (!title || !quantity || !pickupAddress || !donorPhone) {
      return res.status(400).json({ error: 'Missing required donation fields' });
    }

    const isConnected = await connectToDatabase();

    if (isConnected) {
      const donation = new Donation({
        title,
        foodType: foodType || 'Hot Meal',
        quantity,
        servings: Number(servings) || 20,
        donorName: donorName || 'Anonymous Donor',
        donorPhone,
        donorEmail: donorEmail || 'donor@lastplate.org',
        pickupAddress,
        pickupTime: pickupTime || 'Immediate',
        expiryTime: expiryTime || '4 Hours',
        status: 'available',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
        urgency: urgency || 'medium'
      });

      await donation.save();
      return res.status(201).json({ message: 'Donation created successfully', donation });
    } else {
      const newDonation: any = {
        id: 'don_' + Date.now(),
        title,
        foodType: foodType || 'Hot Meal',
        quantity,
        servings: Number(servings) || 20,
        donorName: donorName || 'Anonymous Donor',
        donorPhone,
        donorEmail: donorEmail || 'donor@lastplate.org',
        pickupAddress,
        pickupTime: pickupTime || 'Immediate',
        expiryTime: expiryTime || '4 Hours',
        status: 'available',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
        urgency: urgency || 'medium',
        createdAt: new Date().toISOString()
      };

      memoryDonations.unshift(newDonation);
      return res.status(201).json({ message: 'Donation created successfully', donation: newDonation });
    }
  } catch (error: any) {
    console.error('Create donation error:', error);
    return res.status(500).json({ error: 'Failed to create donation' });
  }
});

// PATCH /api/donations/:id/status (Volunteer Status Updates: AVAILABLE -> COLLECTED -> DELIVERED)
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, volunteerName, volunteerPhone, deliveryProofUrl, deliveryNote } = req.body;

    if (!status || !['available', 'collected', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const isConnected = await connectToDatabase();

    if (isConnected) {
      const updateData: any = { status, updatedAt: new Date() };
      if (volunteerName) updateData.volunteerName = volunteerName;
      if (volunteerPhone) updateData.volunteerPhone = volunteerPhone;
      if (deliveryProofUrl) updateData.deliveryProofUrl = deliveryProofUrl;
      if (deliveryNote) updateData.deliveryNote = deliveryNote;

      const updated = await (Donation as any).findOneAndUpdate({ _id: id }, updateData, { new: true });
      if (!updated) return res.status(404).json({ error: 'Donation record not found' });

      return res.json({ message: `Status updated to ${status}`, donation: updated });
    } else {
      const index = memoryDonations.findIndex(d => d.id === id || d._id === id);
      if (index === -1) return res.status(404).json({ error: 'Donation record not found' });

      memoryDonations[index] = {
        ...memoryDonations[index],
        status,
        ...(volunteerName && { volunteerName }),
        ...(volunteerPhone && { volunteerPhone }),
        ...(deliveryProofUrl && { deliveryProofUrl }),
        ...(deliveryNote && { deliveryNote }),
        updatedAt: new Date().toISOString()
      };

      return res.json({ message: `Status updated to ${status}`, donation: memoryDonations[index] });
    }
  } catch (error: any) {
    console.error('Update donation status error:', error);
    return res.status(500).json({ error: 'Failed to update donation status' });
  }
});

// DELETE /api/donations/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isConnected = await connectToDatabase();

    if (isConnected) {
      await (Donation as any).findOneAndDelete({ _id: id });
      return res.json({ message: 'Donation deleted successfully' });
    } else {
      memoryDonations = memoryDonations.filter(d => d.id !== id && d._id !== id);
      return res.json({ message: 'Donation deleted successfully' });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
