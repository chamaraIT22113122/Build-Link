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
  CheckCircle2,
  HardHat,
  MessageCircle,
  UserPlus,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Mountain,
  Zap,
  Compass,
  Home,
  Check,
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

const CONSTRUCTION_CATEGORIES = [
  { label: 'All Categories', value: 'All Specializations', icon: Compass },
  { label: 'Structural Engineering', value: 'Structural', icon: Building2 },
  { label: 'Geotechnical & NBRO', value: 'Geotechnical', icon: Mountain },
  { label: 'MEP & Solar Electrical', value: 'MEP', icon: Zap },
  { label: 'Foundation & Earthworks', value: 'Foundation', icon: HardHat },
  { label: 'Architecture & Residential', value: 'Residential', icon: Home },
];

function EngineersDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();

  const [engineers, setEngineers] = useState<EngineerDirectoryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [selectedCategory, setSelectedCategory] = useState('All Specializations');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'experience'>('rating');
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  // Read URL params
  useEffect(() => {
    const q = searchParams.get('search');
    const d = searchParams.get('district');
    const s = searchParams.get('specialization');
    if (q) setSearchQuery(q);
    if (d) setSelectedDistrict(d);
    if (s) setSelectedCategory(s);
  }, [searchParams]);

  // Load user connections if signed in
  useEffect(() => {
    if (!token) return;
    const fetchConnections = async () => {
      try {
        const res = await fetch(`${apiUrl}/messages/connections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const ids = new Set<string>(data.data.map((c: any) => c.connectedUserId));
          setConnectedIds(ids);
        }
      } catch {
        // ignore
      }
    };
    fetchConnections();
  }, [token]);

  const loadEngineers = async () => {
    setLoading(true);
    try {
      const queryParts: string[] = [];
      if (searchQuery.trim()) queryParts.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      if (selectedDistrict !== 'All Districts') queryParts.push(`district=${encodeURIComponent(selectedDistrict)}`);
      if (selectedCategory !== 'All Specializations') queryParts.push(`specialization=${encodeURIComponent(selectedCategory)}`);
      if (verifiedOnly) queryParts.push('verifiedOnly=true');

      const url = `${apiUrl}/engineers${queryParts.length > 0 ? `?${queryParts.join('&')}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        let sorted = [...data.data];
        if (sortBy === 'rating') {
          sorted.sort((a, b) => b.ratingAverage - a.ratingAverage);
        } else if (sortBy === 'experience') {
          sorted.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
        }
        setEngineers(sorted);
      }
    } catch (err) {
      console.error('Failed to load engineers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngineers();
  }, [selectedDistrict, selectedCategory, verifiedOnly, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadEngineers();
  };

  const handleConnect = async (engineerUserId: string) => {
    if (!token) {
      router.push(`/login?redirect=/engineers`);
      return;
    }

    setConnectingId(engineerUserId);
    try {
      const res = await fetch(`${apiUrl}/messages/connect/${engineerUserId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setConnectedIds((prev) => new Set(prev).add(engineerUserId));
      }
    } catch {
      // ignore
    } finally {
      setConnectingId(null);
    }
  };

  const handleMessage = (engineerUserId: string) => {
    if (!token) {
      router.push(`/login?redirect=/messages?userId=${engineerUserId}`);
      return;
    }
    router.push(`/messages?userId=${engineerUserId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-blue rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/10">
            <ShieldCheck className="w-4 h-4 text-brand-orange" />
            <span>Verified Sri Lankan Construction Engineers</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Find & Connect with Engineers
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Directly connect with certified structural, geotechnical, and MEP engineers across Sri Lanka. Message them freely with your site photos, drawings, and queries like Messenger.
          </p>
        </div>
      </div>

      {/* Construction Category Filter Pills (Facebook style) */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {CONSTRUCTION_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                isSelected
                  ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20 scale-105'
                  : 'bg-white text-brand-navy border border-brand-border hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-brand-blue'}`} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search & Location Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-brand-border shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-brand-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by engineer name, specialization, keywords (e.g. Concrete, NBRO, Foundation)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-brand-border text-xs sm:text-sm text-brand-navy bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          <button type="submit" className="btn-primary text-xs sm:text-sm font-bold px-6 py-3 shrink-0">
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="rating">Sort: Highest Rated ★</option>
              <option value="experience">Sort: Most Experienced</option>
            </select>
          </div>

          {/* Verified Toggle */}
          <div className="flex items-center justify-end">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-brand-navy">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 text-brand-blue rounded border-brand-border focus:ring-brand-blue"
              />
              <span>Verified Engineers Only</span>
              <ShieldCheck className="w-4 h-4 text-brand-blue" />
            </label>
          </div>
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
              Try adjusting your district or construction category filters.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDistrict('All Districts');
              setSelectedCategory('All Specializations');
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
            const isConnected = connectedIds.has(eng.userId);

            return (
              <div
                key={eng.id}
                className="bg-white rounded-3xl border border-brand-border p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Profile Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-navy to-brand-blue text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                        {eng.displayName?.[0] || 'E'}
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/engineers/${eng.id}`}
                          className="text-base font-bold text-brand-navy hover:text-brand-blue transition-colors truncate block"
                        >
                          {eng.displayName}
                        </Link>
                        <p className="text-xs font-medium text-brand-blue truncate">{eng.title}</p>
                      </div>
                    </div>

                    {eng.verificationStatus === VerificationStatus.VERIFIED && (
                      <span className="badge-verified flex items-center gap-1 shrink-0 text-[10px] py-0.5">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  {/* Rating & Experience */}
                  <div className="flex items-center gap-4 text-xs mb-3">
                    <div className="flex items-center gap-1 font-bold text-amber-600">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{eng.ratingAverage > 0 ? eng.ratingAverage.toFixed(1) : 'New'}</span>
                      <span className="text-brand-muted font-normal text-[11px]">
                        ({eng.ratingCount} reviews)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-brand-text">
                      <Briefcase className="w-3.5 h-3.5 text-brand-blue" />
                      <span>{eng.yearsOfExperience} yrs exp</span>
                    </div>
                  </div>

                  {/* Location */}
                  {(eng.district || eng.city) && (
                    <p className="text-xs text-brand-muted flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-brand-muted flex-shrink-0" />
                      <span>{[eng.city, eng.district].filter(Boolean).join(', ')}</span>
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

                {/* Facebook-style Action Buttons (Message & Connect) */}
                <div className="pt-4 border-t border-brand-border flex items-center gap-2">
                  <button
                    onClick={() => handleMessage(eng.userId)}
                    className="flex-1 btn-primary text-xs font-bold py-2.5 gap-1.5 justify-center shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message
                  </button>

                  <button
                    onClick={() => handleConnect(eng.userId)}
                    disabled={isConnected || connectingId === eng.userId}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      isConnected
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                        : 'bg-white border-brand-border text-brand-navy hover:bg-slate-50'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Connected
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 text-brand-muted" /> Add
                      </>
                    )}
                  </button>

                  <Link
                    href={`/engineers/${eng.id}`}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold text-brand-muted hover:text-brand-navy hover:bg-slate-100 transition-colors"
                    title="View Profile"
                  >
                    Profile
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
