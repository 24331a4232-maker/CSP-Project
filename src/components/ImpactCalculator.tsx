import React, { useState } from 'react';
import { Calculator, Sparkles, Utensils, Leaf, Droplets, DollarSign, TreePine, ArrowRight, ShieldCheck } from 'lucide-react';

export const ImpactCalculator: React.FC = () => {
  const [foodKg, setFoodKg] = useState<number>(100);

  // Calculations based on EPA WARM food waste factors
  const mealsCount = Math.round(foodKg * 2.2); // ~1 kg surplus = ~2.2 meals
  const co2PreventedKg = Math.round(foodKg * 2.5); // 1 kg food waste in landfill = ~2.5 kg CO2e
  const waterSavedLiters = Math.round(foodKg * 1000); // ~1000 liters per kg food produced
  const valueRescuedUSD = Math.round(mealsCount * 4.5); // ~$4.50 per wholesome meal value
  const treesPlantedEquivalent = Math.round(co2PreventedKg / 20); // ~1 tree absorbs 20kg CO2/year

  return (
    <section id="calculator" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-gradient-to-br from-emerald-50 via-white to-orange-50/50 rounded-3xl p-8 sm:p-12 border border-emerald-200/80 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Calculator Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <Calculator className="w-3.5 h-3.5 text-[#22C55E]" />
              INTERACTIVE ESG & ECOLOGICAL CALCULATOR
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Calculate Your Food Rescue Impact
            </h2>

            <p className="text-gray-600 text-sm sm:text-base">
              Slide to select the weight of surplus food your hotel, event, or kitchen generates per week to see instant social and environmental savings.
            </p>

            {/* Slider Control */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">Weekly Surplus Food Weight:</span>
                <span className="text-2xl font-black text-[#22C55E]">{foodKg} kg / week</span>
              </div>

              <input
                type="range"
                min={10}
                max={2000}
                step={10}
                value={foodKg}
                onChange={(e) => setFoodKg(Number(e.target.value))}
                className="w-full accent-[#22C55E] h-2.5 bg-gray-200 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-gray-400 font-semibold">
                <span>10 kg (Small Bistro)</span>
                <span>500 kg (Banquet Hall)</span>
                <span>2,000 kg (Hotel Resort)</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Tax & ESG Compliant:</strong> Partner hotels receive quarterly certified impact audit reports for corporate sustainability reporting.
              </span>
            </div>
          </div>

          {/* Right Column: Calculated Impact Output Cards */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#22C55E] flex items-center justify-center font-bold">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-500 font-semibold block">Meals Created</span>
              <p className="text-3xl font-black text-gray-900">{mealsCount.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-600 font-bold">Feeds local community</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-500 font-semibold block">CO2 Prevented</span>
              <p className="text-3xl font-black text-teal-800">{co2PreventedKg.toLocaleString()} kg</p>
              <p className="text-[10px] text-teal-600 font-bold">Landfill methane avoided</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Droplets className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-500 font-semibold block">Water Saved</span>
              <p className="text-3xl font-black text-blue-900">{(waterSavedLiters / 1000).toFixed(0)}k Liters</p>
              <p className="text-[10px] text-blue-600 font-bold">Agri water preserved</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-500 font-semibold block">Rescued Meal Value</span>
              <p className="text-3xl font-black text-orange-600">${valueRescuedUSD.toLocaleString()}</p>
              <p className="text-[10px] text-orange-600 font-bold">Direct catering value</p>
            </div>

            <div className="col-span-2 bg-gradient-to-r from-emerald-800 to-gray-900 text-white p-4 rounded-2xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TreePine className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Equivalent to planting <strong>{treesPlantedEquivalent} mature trees</strong> every single year!</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
