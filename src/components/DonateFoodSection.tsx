import React, { useState } from 'react';
import { DonationItem, FoodCategory, UrgencyLevel } from '../types';
import { Utensils, Sparkles, Clock, MapPin, Phone, ShieldCheck, Upload, AlertCircle, Camera, CheckCircle2 } from 'lucide-react';

interface DonateFoodSectionProps {
  onAddDonation: (newItem: DonationItem) => void;
  onSuccessNavigate?: () => void;
}

export const DonateFoodSection: React.FC<DonateFoodSectionProps> = ({ onAddDonation, onSuccessNavigate }) => {
  const [formData, setFormData] = useState({
    title: '',
    organizationName: '',
    organizationType: 'Hotel' as const,
    category: 'Cooked Catering' as FoodCategory,
    quantity: '',
    preparationTime: '30 minutes ago',
    expiryHours: 4,
    urgency: 'High' as UrgencyLevel,
    storageRequirement: 'Insulated Hot Food Box (>60°C)',
    address: '',
    city: 'Metropolis',
    contactPhone: '',
    dietaryTagsInput: 'Freshly Cooked, Insulated Storage',
    photoUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
  });

  const [isAiCalculating, setIsAiCalculating] = useState(false);
  const [aiGuidanceResult, setAiGuidanceResult] = useState<any>(null);

  const handleAiEstimate = async () => {
    if (!formData.title) return;
    setIsAiCalculating(true);
    try {
      const res = await fetch('/api/ai/food-estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodTitle: formData.title,
          foodCategory: formData.category,
          quantity: formData.quantity || '40 Servings',
          preparationTime: formData.preparationTime,
        }),
      });
      const data = await res.json();
      setAiGuidanceResult(data);
      if (data.shelfLifeHours) {
        setFormData((prev) => ({ ...prev, expiryHours: data.shelfLifeHours }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiCalculating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.organizationName || !formData.address) return;

    const estimatedMealsCalculated = aiGuidanceResult?.estimatedMeals || Math.round(parseInt(formData.quantity || '20', 10) * 2 || 40);

    const newItem: DonationItem = {
      id: `don-${Date.now()}`,
      title: formData.title,
      organizationName: formData.organizationName,
      organizationType: formData.organizationType,
      category: formData.category,
      quantity: formData.quantity || '30 Servings',
      estimatedMeals: estimatedMealsCalculated,
      preparationTime: formData.preparationTime,
      expiryHours: Number(formData.expiryHours),
      urgency: formData.urgency,
      storageRequirement: formData.storageRequirement,
      address: formData.address,
      city: formData.city,
      coordinates: { lat: 37.7749, lng: -122.4194 },
      status: 'Available',
      createdAt: new Date().toISOString(),
      contactPhone: formData.contactPhone || '+1 (555) 019-2831',
      dietaryTags: formData.dietaryTagsInput.split(',').map((s) => s.trim()).filter(Boolean),
      aiGuidance: aiGuidanceResult || {
        estimatedMeals: estimatedMealsCalculated,
        shelfLifeHours: Number(formData.expiryHours),
        storageType: formData.storageRequirement,
        urgencyLevel: formData.urgency,
        dietaryBadges: ['Ready to Serve', 'Fresh Surplus'],
        logisticsTip: 'Ensure thermal hold during volunteer transport.',
      },
    };

    onAddDonation(newItem);
    if (onSuccessNavigate) onSuccessNavigate();
  };

  return (
    <div className="py-8 sm:py-12 max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
      
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
          <Utensils className="w-3.5 h-3.5 text-[#22C55E]" />
          Commercial Surplus Portal
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Donate Surplus Food <span className="text-[#22C55E]">Batch</span>
        </h1>
        <p className="text-gray-600 text-sm max-w-xl mx-auto font-medium">
          Post untouched gourmet meals from your hotel or event. Local volunteer captains will pick up within minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl space-y-6 border border-white/80 shadow-2xl">
        
        {/* Title & Organization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
              Food Batch Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Gourmet Banquet Surplus (Grilled Salmon & Rice)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
              Organization / Hotel Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Grand Palace Hotel & Suites"
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
            />
          </div>
        </div>

        {/* Category & Organization Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Food Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as FoodCategory })}
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
            >
              <option value="Cooked Catering">Cooked Catering</option>
              <option value="Bakery & Pastries">Bakery & Pastries</option>
              <option value="Fresh Produce">Fresh Produce</option>
              <option value="Dairy & Beverage">Dairy & Beverage</option>
              <option value="Packaged & Frozen">Packaged & Frozen</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Donor Type</label>
            <select
              value={formData.organizationType}
              onChange={(e) => setFormData({ ...formData, organizationType: e.target.value as any })}
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
            >
              <option value="Hotel">Hotel</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Event Host">Event Host / Wedding</option>
              <option value="Convention Center">Convention Center</option>
              <option value="Bakery">Bakery</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Urgency Level</label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value as UrgencyLevel })}
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none"
            >
              <option value="High">High (Immediate Pick Up &lt;3 hrs)</option>
              <option value="Medium">Medium (3-6 hrs window)</option>
              <option value="Low">Low (Next 12-24 hrs)</option>
            </select>
          </div>
        </div>

        {/* Quantity & Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Quantity / Trays</label>
            <input
              type="text"
              placeholder="e.g. 50 Servings / 10 Hot Trays"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Expiry Safe Window (Hours)</label>
            <input
              type="number"
              min="1"
              max="48"
              value={formData.expiryHours}
              onChange={(e) => setFormData({ ...formData, expiryHours: Number(e.target.value) })}
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>

        {/* AI Smart Logistics Estimator Callout */}
        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
              <Sparkles className="w-4 h-4 text-[#22C55E]" />
              AI Food Safety & Logistics Assistant
            </div>
            <p className="text-[11px] text-emerald-800">
              Auto-calculate safe shelf life, storage thermal requirements, and estimated meal portions.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAiEstimate}
            disabled={isAiCalculating}
            className="bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs shrink-0 cursor-pointer"
          >
            {isAiCalculating ? 'Analyzing...' : 'Run AI Safety Check'}
          </button>
        </div>

        {/* AI Output preview card */}
        {aiGuidanceResult && (
          <div className="p-4 bg-emerald-900 text-white rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-emerald-300">
              <span>AI Logistics Guidance</span>
              <span>{aiGuidanceResult.estimatedMeals} Meals Calculated</span>
            </div>
            <p className="text-emerald-100">{aiGuidanceResult.logisticsTip}</p>
          </div>
        )}

        {/* Location & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Pickup Street Address *</label>
            <input
              type="text"
              required
              placeholder="e.g. 742 Park Avenue, Gate 3 Loading Dock"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Contact Phone *</label>
            <input
              type="text"
              required
              placeholder="e.g. +1 (555) 234-5678"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#22C55E] hover:bg-emerald-600 text-white font-extrabold text-sm py-4 rounded-2xl shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Publish Food Surplus for Volunteer Rescue</span>
        </button>

      </form>

    </div>
  );
};
