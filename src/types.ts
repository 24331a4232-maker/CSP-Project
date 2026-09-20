export type UserRoleType = 'DONOR' | 'VOLUNTEER' | 'ADMIN' | 'donor' | 'volunteer' | 'admin';
export type FoodCategory = 'Cooked Catering' | 'Raw Ingredients' | 'Packaged Goods' | 'Baked Goods' | 'Beverages' | 'Bakery & Pastries' | 'Produce & Groceries' | 'Dairy & Refrigerated' | 'Packaged/Non-Perishable' | 'Other';
export type UrgencyLevel = 'High' | 'Medium' | 'Low';
export type PickupStatus = 'Available' | 'Claimed' | 'In Transit' | 'Delivered' | 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'COMPLETED' | 'Assigned' | 'Collected';

export interface AIGuidance {
  estimatedMeals: number;
  shelfLifeHours: number;
  storageType: string;
  urgencyLevel: string;
  dietaryBadges: string[];
  logisticsTip: string;
}

export interface DashboardMetrics {
  totalDonations: number;
  availablePickups: number;
  collectedCount: number;
  deliveredCount: number;
  mealsSaved: number;
  co2SavedKg: number;
}

export interface DonationItem {
  id: string;
  title: string;
  organizationName: string;
  organizationType: string | 'Restaurant' | 'Hotel' | 'Bakery' | 'Grocery' | 'Event Space' | 'Convention Center' | 'Other';
  category: FoodCategory | string;
  quantity: string;
  estimatedMeals: number;
  preparationTime?: string;
  expiryHours: number;
  urgency: UrgencyLevel | string;
  storageRequirement?: string;
  address: string;
  city: string;
  coordinates: { lat: number; lng: number };
  status: PickupStatus;
  createdAt: string;
  contactPhone?: string;
  volunteerName?: string;
  qrToken?: string;
  adminNotes?: string;
  dietaryTags?: string[];
  claimedByVolunteer?: boolean | string;
  updatedBy?: string;
  updatedByRole?: string;
  adminVerified?: boolean;
  updatedByName?: string;
  aiGuidance?: AIGuidance | any;
  updatedAt?: string;
  proofPhotoUrl?: string;
}

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
  is_active?: boolean;
  updated_at?: string | number;
  availability?: string;
  bio?: string;
  avatar_url?: string;
  privacy_settings?: { profileVisible?: boolean; hidePhone?: boolean; locationOnPickup?: boolean; };
  preferences?: { language?: string; theme?: string; };
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  username: string;
  password?: string;
  phone: string;
  role: 'admin';
  organization: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  permissions: string[];
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  updated_at?: string;
}

export interface VolunteerUser {
  id: string;
  full_name: string;
  email: string;
  username: string;
  password?: string;
  phone: string;
  role: 'volunteer';
  organization?: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  vehicle_type: string;
  availability_status: 'Available' | 'Busy' | 'Off Duty';
  assigned_zones: string[];
  total_deliveries: number;
  hours_served: number;
  rating: number;
  is_verified: boolean;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  updated_at?: string;
}

export interface DonorUser {
  id: string;
  full_name: string;
  email: string;
  username: string;
  password?: string;
  phone: string;
  role: 'donor';
  donor_type: 'Individual' | 'Restaurant' | 'Supermarket' | 'Caterer' | 'Corporate' | 'Hotel' | string;
  organization_name: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  total_donations: number;
  food_donated_kg: number;
  meals_provided: number;
  badges: string[];
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  updated_at?: string;
}

export interface DatabaseTableSummary {
  tableName: string;
  displayName: string;
  description: string;
  category: 'User Roles' | 'Operations' | 'Auditing & System';
  count: number;
  fields: string[];
  iconName: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  donor_name?: string;
  donor_phone?: string;
  donor_email?: string;
  donor_organization?: string;
  organization?: string;
  volunteer_id?: string;
  volunteer_name?: string;
  volunteer_phone?: string;
  food_type: string;
  category?: string;
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
  notes?: string;
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
