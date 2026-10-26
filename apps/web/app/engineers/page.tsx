'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  EngineerDirectoryItemDto,
  VerificationStatus,
} from '@buildlink/shared';
import {
  ShieldCheck,
  Star,
  MapPin,
  Briefcase,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  HardHat,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

const SRI_LANKA_DISTRICTS = [
  'All Districts',
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
];

const POPULAR_SPECIALIZATIONS = [
  'All Specializations',
  'Structural Analysis',
  'Foundation Design',
  'High-Rise Concrete',
  'Geotechnical Engineering',
  'MEP & Electrical Systems',
  'Waterproofing & Remediation',
  'Civil Project Management',
  'Roof & Truss Engineering',
];

function EngineersDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [engineers, setEngineers] = useState<EngineerDirectoryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [selectedSpec, setSelectedSpec] = useState('All Specializations');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'fee'>('rating');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  // Read URL params
  useEffect(() => {
    const q = searchParams.get('search');
    const d = searchParams.get('district');
    const s = searchParams.get('specialization');
    if (q) setSearchQuery(q);
    if (d) setSelectedDistrict(d);
    if (s) setSelectedSpec(s);
  }, [searchParams]);

  const loadEngineers = async () => {
    setLoading(true);
    try {
      const queryParts: string[] = [];
      if (searchQuery.trim()) queryParts.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      if (selectedDistrict !== 'All Districts') queryParts.push(`district=${encodeURIComponent(selectedDistrict)}`);
      if (selectedSpec !== 'All Specializations') queryParts.push(`specialization=${encodeURIComponent(selectedSpec)}`);
      if (verifiedOnly) queryParts.push('verifiedOnly=true');
      queryParts.push(`sortBy=${sortBy}`);

      const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';

      const res = await fetch(`${apiUrl}/engineers${queryString}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setEngineers(data.data);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngineers();
  }, [searchQuery, selectedDistrict, selectedSpec, verifiedOnly, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-navy via-[#102c52] to-brand-blue text-white p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-brand-orange text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-brand-orange" />
            Verified Professional Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Find Certified Civil & Structural Engineers
          </h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            Connect with registered Sri Lankan engineers for site inspections, structural integrity assessments, blueprint reviews, and construction consultations.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-blue-100">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              IESL & Official Bodies Verified
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Direct Consultation Booking
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Transparent Pricing & Ratings
            </span>
          </div>
        </div>

        {/* Decorative backdrop shapes */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand-orange/20 blur-3xl pointer-events-none" />
      </div>

      {/* Main Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, title, keywords..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <Search className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
          </div>

          {/* District Selector */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {SRI_LANKA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Specialization Filter */}
          <div>
            <select
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {POPULAR_SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="rating">Sort: Highest Rated</option>
              <option value="experience">Sort: Most Experienced</option>
              <option value="fee">Sort: Lowest Consultation Fee</option>
            </select>
          </div>
        </div>

        {/* Filter Pills & Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-brand-navy">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 text-brand-blue rounded border-brand-border focus:ring-brand-blue"
            />
            <span>Show Verified Engineers Only</span>
            <ShieldCheck className="w-4 h-4 text-brand-blue" />
          </label>

          <span className="text-xs text-brand-muted">
            Found {engineers.length} registered professionals
          </span>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
        </div>
      ) : engineers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-brand-border text-center space-y-4 shadow-sm">
          <HardHat className="w-14 h-14 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-brand-navy">No engineers found</h3>
            <p className="text-xs text-brand-muted max-w-sm mx-auto mt-1">
              Try adjusting your district or specialization filters to view available certified engineers.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDistrict('All Districts');
              setSelectedSpec('All Specializations');
              setVerifiedOnly(false);
            }}
            className="btn-secondary text-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {engineers.map((eng) => {
            const initials = eng.displayName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={eng.id}
                className="bg-white rounded-3xl border border-brand-border p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Profile Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-navy to-brand-blue text-white flex items-center justify-center font-bold text-base shadow-md">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-brand-navy group-hover:text-brand-blue transition-colors">
                            {eng.displayName}
                          </h3>
                        </div>
                        <p className="text-xs text-brand-muted font-medium mt-0.5 line-clamp-1">
                          {eng.title}
                        </p>
                        {eng.isVerified && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-brand-blue">
                            <ShieldCheck className="w-3 h-3" /> Verified Member
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating & Experience */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 text-xs mb-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <div>
                        <span className="font-extrabold text-brand-navy">
                          {eng.ratingAverage > 0 ? eng.ratingAverage.toFixed(1) : 'New'}
                        </span>
                        <span className="text-[10px] text-brand-muted ml-1">
                          ({eng.ratingCount} reviews)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-brand-text">
                      <Briefcase className="w-3.5 h-3.5 text-brand-blue" />
                      <span>{eng.yearsOfExperience} yrs experience</span>
                    </div>
                  </div>

                  {/* Location */}
                  {(eng.district || eng.city) && (
                    <p className="text-xs text-brand-muted flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-brand-muted flex-shrink-0" />
                      <span>
                        {[eng.city, eng.district].filter(Boolean).join(', ')}
                      </span>
                    </p>
                  )}

                  {/* Specialization Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {eng.specializations.slice(0, 3).map((spec, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-brand-navy"
                      >
                        {spec}
                      </span>
                    ))}
                    {eng.specializations.length > 3 && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-brand-muted">
                        +{eng.specializations.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Fee & Actions */}
                <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-muted block">
                      Consultation Fee
                    </span>
                    <span className="text-sm font-extrabold text-brand-navy">
                      {eng.consultationFee > 0
                        ? `LKR ${eng.consultationFee.toLocaleString()}`
                        : 'Free Initial Review'}
                    </span>
                  </div>

                  <Link
                    href={`/engineers/${eng.id}`}
                    className="btn-accent text-xs font-bold gap-1.5 shadow-sm"
                  >
                    View & Book <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EngineersDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
        </div>
      }
    >
      <EngineersDirectoryContent />
    </Suspense>
  );
}
