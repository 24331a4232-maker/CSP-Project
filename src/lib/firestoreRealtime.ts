import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";
import { DonationItem, PickupStatus } from "../types";

// Convert Firestore document data into strongly typed DonationItem
export function mapDocToDonationItem(id: string, data: any): DonationItem {
  const statusRaw = String(data.status || 'available').toLowerCase();
  let status: PickupStatus = 'Available';
  if (statusRaw === 'claimed' || statusRaw === 'assigned') status = 'Assigned';
  else if (statusRaw === 'collected' || statusRaw === 'picked_up') status = 'Collected';
  else if (statusRaw === 'delivered') status = 'Delivered';

  return {
    id: id || data.id,
    title: data.food_name || data.title || 'Surplus Catering Meals',
    organizationName: data.organization || data.organizationName || data.donor_name || 'Food Partner',
    organizationType: data.organization_type || data.organizationType || 'Hotel',
    category: data.category || 'Cooked Catering',
    quantity: data.quantity ? `${data.quantity} ${data.quantity_unit || 'Servings'}`.trim() : '50 Servings',
    estimatedMeals: Number(data.estimated_meals || data.meals_count || data.estimatedMeals || 50),
    preparationTime: data.preparation_time || data.preparationTime || '1 hour ago',
    expiryHours: Number(data.expiry_hours || data.expiryHours || 4),
    urgency: (data.urgency || 'Medium') as any,
    storageRequirement: data.storage_instructions || data.storageRequirement || 'Standard Thermal Packaging',
    address: data.address || 'Metropolis Center',
    city: data.city || 'Metropolis',
    coordinates: {
      lat: Number(data.latitude || data.coordinates?.lat || 37.7749),
      lng: Number(data.longitude || data.coordinates?.lng || -122.4194)
    },
    status,
    claimedByVolunteer: data.claimed_by_volunteer || data.claimedByVolunteer,
    proofPhotoUrl: data.proof_photo_url || data.proofPhotoUrl,
    createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    contactPhone: data.contact_phone || data.contactPhone || '+1 (555) 019-2831',
    dietaryTags: Array.isArray(data.dietary_tags)
      ? data.dietary_tags
      : (data.dietaryTags || ['Freshly Prepared', 'Inspected']),
    updatedBy: data.updated_by || data.updatedBy,
    updatedByRole: data.updated_by_role || data.updatedByRole,
    updatedByName: data.updated_by_name || data.updatedByName,
    updatedAt: data.updated_at || data.updatedAt,
    adminVerified: Boolean(data.admin_verified ?? data.adminVerified),
    adminNotes: data.admin_notes || data.adminNotes,
    aiGuidance: data.aiGuidance || {
      estimatedMeals: Number(data.estimated_meals || 50),
      shelfLifeHours: Number(data.expiry_hours || 4),
      storageType: data.storage_instructions || 'Thermal Packaging',
      urgencyLevel: data.urgency || 'Medium',
      dietaryBadges: ['Admin Verified', 'Safe for Distribution'],
      logisticsTip: 'Real-time verified by FoodBridge System Administrator.'
    }
  };
}

// Check if a donation item was updated by admin
export function isUpdatedByAdmin(d: DonationItem): boolean {
  if (d.updatedBy === 'admin' || d.updatedByRole === 'admin') return true;
  if (d.adminVerified === true) return true;
  if (typeof d.updatedByName === 'string' && d.updatedByName.toLowerCase().includes('admin')) return true;
  if (typeof d.adminNotes === 'string' && d.adminNotes.trim().length > 0) return true;
  return false;
}

// Real-time listener for food_donations collection
export function subscribeToRealtimeDonations(
  onData: (items: DonationItem[], adminUpdatedOnly: DonationItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, 'food_donations');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const allItems: DonationItem[] = [];
        snapshot.forEach((docSnap) => {
          allItems.push(mapDocToDonationItem(docSnap.id, docSnap.data()));
        });

        // Filter for real-time data updated by admin
        const adminUpdated = allItems.filter(isUpdatedByAdmin);
        onData(allItems, adminUpdated);
      },
      (err) => {
        console.warn('[firestoreRealtime] Realtime subscription error:', err.message);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn('[firestoreRealtime] Failed to initialize snapshot listener:', err.message);
    return () => {};
  }
}

// Update donation status or notes as admin (triggers real-time update in Firestore)
export async function updateDonationAsAdmin(
  id: string,
  updates: {
    status?: PickupStatus;
    adminNotes?: string;
    adminVerified?: boolean;
    claimedByVolunteer?: string;
  }
): Promise<void> {
  const docRef = doc(db, 'food_donations', id);
  const firestoreData: any = {
    updated_by: 'admin',
    updated_by_role: 'admin',
    updated_by_name: 'FoodBridge Administrator',
    updated_at: new Date().toISOString(),
    admin_verified: updates.adminVerified !== undefined ? updates.adminVerified : true
  };

  if (updates.status) {
    firestoreData.status = updates.status.toLowerCase();
  }
  if (updates.adminNotes !== undefined) {
    firestoreData.admin_notes = updates.adminNotes;
  }
  if (updates.claimedByVolunteer !== undefined) {
    firestoreData.claimed_by_volunteer = updates.claimedByVolunteer;
  }

  await setDoc(docRef, firestoreData, { merge: true });

  // Also sync to local backend API so in-memory cache stays in sync
  try {
    await fetch(`/rest/v1/food_donations?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreData)
    });
  } catch (e) {
    // Non-blocking
  }
}

// Delete donation as admin in real-time
export async function deleteDonationAsAdmin(id: string): Promise<void> {
  const docRef = doc(db, 'food_donations', id);
  await deleteDoc(docRef);

  try {
    await fetch(`/rest/v1/food_donations?id=eq.${id}`, {
      method: 'DELETE'
    });
  } catch (e) {
    // Non-blocking
  }
}
