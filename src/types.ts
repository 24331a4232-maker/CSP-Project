export interface User {
  id: string;
  name: string;
  email: string;
  role: 'DONOR' | 'VOLUNTEER' | 'ADMIN';
  phone?: string;
  created_at: number;
  username?: string;
  organization?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  last_login?: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  volunteer_id?: string;
  food_type: string;
  quantity: string;
  meals: number;
  pickup_location: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_time: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'COMPLETED';
  qr_token: string;
  created_at: number;
  scanned_at?: number;
}

export interface Location {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  sharing_enabled: boolean;
}

export interface Notification {
  id: string;
  donation_id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: number;
}
