import React, { useEffect, useState } from 'react';
import { Utensils, Users, PackageCheck, Building2, Flame, Award, Globe2 } from 'lucide-react';
import { DashboardMetrics } from '../types';

interface StatisticsSectionProps {
  metrics: DashboardMetrics;
}

export const StatisticsSection: React.FC<StatisticsSectionProps> = ({ metrics }) => {
  const [mealsCount, setMealsCount] = useState(0);
  const [volunteersCount, setVolunteersCount] = useState(0);
  const [donationsCount, setDonationsCount] = useState(0);
  const [citiesCount, setCitiesCount] = useState(0);

  useEffect(() => {
    // Smooth counting effect up to metrics
    const duration = 1800; // ms
    const steps = 40;
    const intervalTime = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setMealsCount(Math.floor(metrics.mealsSaved * progress));
      setVolunteersCount(Math.floor(3240 * progress));
      setDonationsCount(Math.floor(metrics.totalDonations * progress));
      setCitiesCount(Math.floor(42 * progress));

      if (currentStep >= steps) {
        clearInterval(timer);
        setMealsCount(metrics.mealsSaved);
        setVolunteersCount(3240);
        setDonationsCount(metrics.totalDonations);
        setCitiesCount(42);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [metrics]);

  const statsList = [
    {
      id: 'meals',
      label: 'Meals Saved',
      value: mealsCount.toLocaleString() + '+',
      description: 'Rescued from banquet halls, hotel buffets & catered summits.',
      icon: Utensils,
      color: 'from-emerald-500 to-emerald-600',
      badge: '+12% this week',
    },
    {
      id: 'volunteers',
      label: 'Active Volunteers',
      value: volunteersCount.toLocaleString() + '+',
      description: 'Community drivers, bike couriers & local food captains.',
      icon: Users,
      color: 'from-orange-500 to-amber-600',
      badge: 'Verified Captains',
    },
    {
      id: 'donations',
      label: 'Food Donations',
      value: donationsCount.toLocaleString() + '+',
      description: 'Completed surplus pickups from accredited food partners.',
      icon: PackageCheck,
      color: 'from-teal-500 to-emerald-700',
      badge: 'Zero Food Waste',
    },
    {
      id: 'cities',
      label: 'Cities Covered',
      value: citiesCount.toLocaleString() + ' Metros',
      description: 'Rapid expansion across major urban hospitality centers.',
      icon: Globe2,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Nationwide Network',
    },
  ];

  return (
    <section className="py-16 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Flame className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>REAL-TIME MEASURABLE IMPACT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Transforming Surplus into Life-Changing Meals
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Every donation prevents landfill methane while delivering wholesome nutrition to local shelters, veterans centers, and neighborhood food banks.
          </p>
        </div>

        {/* Stats Grid - Glassmorphism Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsList.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.id}
                className="relative bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
              >
                {/* Subtle top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${stat.color}`} />

                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                    {stat.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                    {stat.value}
                  </h3>
                  <p className="text-sm font-bold text-gray-800">{stat.label}</p>
                </div>

                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Extra Environmental Bar */}
        <div className="mt-10 bg-gradient-to-r from-emerald-900 via-emerald-800 to-gray-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-emerald-300">Environmental Savings Milestone</h4>
              <p className="text-xs text-emerald-100/80 max-w-xl">
                By redirecting food from landfills, our community has reduced <strong className="text-white font-semibold">74,250 kg of CO2 equivalent emissions</strong> and saved over <strong className="text-white font-semibold">32 Million Liters</strong> of agricultural water this year alone.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-800/80 px-4 py-2 rounded-xl border border-emerald-700/60 text-xs font-semibold shrink-0">
            <span>Official ESG Impact Verified</span>
          </div>
        </div>

      </div>
    </section>
  );
};
