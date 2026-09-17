import React, { useState } from 'react';
import { X, Sparkles, Package, Building2, MapPin, Phone, Clock, ShieldCheck, CheckCircle2, Loader2, Utensils } from 'lucide-react';
import { DonationItem, FoodCategory, UrgencyLevel } from '../types';

interface DonateFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDonation: (item: DonationItem) => void;
}

export const DonateFoodModal: React.FC<DonateFoodModalProps> = ({
  isOpen,
  onClose,
  onAddDonation,
}) => {
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<DonationItem['organizationType']>('Hotel');
  const [foodTitle, setFoodTitle] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Cooked Catering');
  const [quantity, setQuantity] = useState('');
  const [prepTime, setPrepTime] = useState('30 minutes ago');
  const [expiryHours, setExpiryHours] = useState(4);
  const [urgency, setUrgency] = useState<UrgencyLevel>('High');
  const [storageRequirement, setStorageRequirement] = useState('Insulated Hot Box (>60°C)');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Metropolis');
  const [phone, setPhone] = useState('');
  const [dietaryInput, setDietaryInput] = useState('Freshly Cooked, Halal Friendly');

  const [isAILoading, setIsAILoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<any | null>(null);

  if (!isOpen) return null;

  // Handle AI Estimation from backend
  const handleRunAIEstimation = async () => {
    if (!foodTitle) {
      alert('Please enter a Food Title first to run AI estimation.');
      return;
    }

    setIsAILoading(true);
    try {
      const response = await fetch('/api/ai/food-estimator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodTitle,
          foodCategory: category,
          quantity: quantity || '50 Servings',
          preparationTime: prepTime,
        }),
      });

      const data = await response.json();
      setAiAdvice(data);

      if (data.shelfLifeHours) setExpiryHours(data.shelfLifeHours);
      if (data.storageType) setStorageRequirement(data.storageType);
      if (data.urgencyLevel) setUrgency(data.urgencyLevel as UrgencyLevel);
    } catch (err) {
      console.error('AI estimation error:', err);
      // Fallback advice
      setAiAdvice({
        estimatedMeals: 60,
        shelfLifeHours: 3,
        storageType: 'Insulated Hot Food Box',
        urgencyLevel: 'High',
        logisticsTip: 'Keep food in sealed food-safe containers until volunteer pickup.',
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!foodTitle || !orgName || !address) {
      alert('Please complete all required fields.');
      return;
    }

    const tags = dietaryInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const estMeals = aiAdvice?.estimatedMeals || Math.round(parseInt(quantity || '30', 10) * 2 || 40);

    const newItem: DonationItem = {
      id: 'don-' + Date.now().toString().slice(-5),
      title: foodTitle,
      organizationName: orgName,
      organizationType: orgType,
      category,
      quantity: quantity || '40 Servings',
      estimatedMeals: estMeals,
      preparationTime: prepTime,
      expiryHours,
      urgency,
      storageRequirement,
      address,
      city: city || 'Metropolis',
      coordinates: { lat: 37.77, lng: -122.41 },
      status: 'Available',
      createdAt: new Date().toISOString(),
      contactPhone: phone || '+1 (555) 123-4567',
      dietaryTags: tags.length > 0 ? tags : ['Fresh Catering', 'Nutritious'],
      aiGuidance: aiAdvice || {
        estimatedMeals: estMeals,
        shelfLifeHours: expiryHours,
        storageType: storageRequirement,
        urgencyLevel: urgency,
        dietaryBadges: tags,
        logisticsTip: 'Ensure insulated thermal carriers are ready for volunteer collection.',
      },
    };

    onAddDonation(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 border border-emerald-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Package className="w-3.5 h-3.5 text-[#22C55E]" />
            DONATE SURPLUS FOOD
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            List Food for Volunteer Rescue
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Connect surplus food from your hotel, banquet, or event with nearby volunteers within minutes.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Organization Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Organization / Hotel Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grand Hyatt Banquet Hall"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Organization Type
              </label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-800"
              >
                <option value="Hotel">Hotel / Resort</option>
                <option value="Restaurant">Restaurant / Bistro</option>
                <option value="Event Host">Event / Wedding Host</option>
                <option value="Convention Center">Convention Center</option>
                <option value="Bakery">Bakery / Bakery Chain</option>
              </select>
            </div>
          </div>

          {/* Food Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Food Title / Description *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 Trays of Grilled Chicken, Roasted Veggies & Basmati Rice"
                  value={foodTitle}
                  onChange={(e) => setFoodTitle(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                
                {/* AI Estimator Button */}
                <button
                  type="button"
                  onClick={handleRunAIEstimation}
                  disabled={isAILoading}
                  className="bg-gradient-to-r from-emerald-800 to-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:from-emerald-900 hover:to-black transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                >
                  {isAILoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>AI Safety Guidance</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="Cooked Catering">Cooked Catering / Hot Meals</option>
                <option value="Bakery & Pastries">Bakery & Fresh Pastries</option>
                <option value="Fresh Produce">Fresh Organic Produce / Fruit</option>
                <option value="Dairy & Beverage">Dairy & Fresh Juices</option>
                <option value="Packaged & Frozen">Packaged Goods / Dry Goods</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Quantity / Servings *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 60 Servings / 8 Heated Trays"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* AI Advice Output Banner if generated */}
          {aiAdvice && (
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-gray-900 text-white p-4 rounded-2xl text-xs space-y-2 border border-emerald-400/40 shadow-sm">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  AI Estimated Shelf Life & Safety Plan
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">VERIFIED</span>
              </div>
              <p className="text-emerald-100 font-medium">{aiAdvice.logisticsTip}</p>
              <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                <span className="bg-emerald-950/80 px-2 py-1 rounded text-emerald-200 font-semibold">
                  Est. Meals: ~{aiAdvice.estimatedMeals}
                </span>
                <span className="bg-emerald-950/80 px-2 py-1 rounded text-emerald-200 font-semibold">
                  Safe Window: {aiAdvice.shelfLifeHours} Hours
                </span>
                <span className="bg-emerald-950/80 px-2 py-1 rounded text-emerald-200 font-semibold">
                  Storage: {aiAdvice.storageType}
                </span>
              </div>
            </div>
          )}

          {/* Storage & Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Storage Requirement
              </label>
              <input
                type="text"
                value={storageRequirement}
                onChange={(e) => setStorageRequirement(e.target.value)}
                placeholder="e.g. Insulated Hot Box (>60°C)"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Pickup Window (Hours)
              </label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value={2}>Within 2 Hours (Urgent)</option>
                <option value={4}>Within 4 Hours (Standard Catering)</option>
                <option value={8}>Within 8 Hours (Same Day)</option>
                <option value={24}>Within 24 Hours (Bakery / Produce)</option>
              </select>
            </div>
          </div>

          {/* Address & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Pickup Address & Dock Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 742 Park Ave, Dock Gate B"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Dietary Badges (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Halal Friendly, Vegetarian, Gluten Free, Nut Free"
              value={dietaryInput}
              onChange={(e) => setDietaryInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Food Listing</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
