'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { ConstructionGroupDto } from '@buildlink/shared';
import {
  Users,
  Search,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Globe,
  Lock,
  MapPin,
  Building2,
  Compass,
} from 'lucide-react';

export default function GroupsPage() {
  const { user, token } = useAuth();
  const [groups, setGroups] = useState<ConstructionGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/posts/groups`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setGroups(data.data);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [token]);

  const handleToggleJoin = async (groupId: string) => {
    if (!token || !user) {
      alert('Please log in to join construction groups.');
      return;
    }

    // Optimistic toggle
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const willJoin = !g.isMember;
          return {
            ...g,
            isMember: willJoin,
            membersCount: willJoin ? g.membersCount + 1 : Math.max(1, g.membersCount - 1),
          };
        }
        return g;
      })
    );

    try {
      const res = await fetch(`${apiUrl}/posts/groups/${groupId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  isMember: data.data.isMember,
                  membersCount: data.data.membersCount,
                }
              : g
          )
        );
      }
    } catch {
      // Revert if error
      loadGroups();
    }
  };

  const categories = [
    'ALL',
    'Residential',
    'Structural Engineering',
    'Sustainable Construction',
    'Geotechnical & Landslides',
    'Electrical & Renewable',
  ];

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || g.category === selectedCategory;
    const matchesTab = activeTab === 'discover' || (activeTab === 'my-groups' && g.isMember);
    return matchesSearch && matchesCategory && matchesTab;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-navy via-slate-900 to-brand-blue text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
            <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-300">
              <Users className="w-4 h-4 text-brand-orange" />
              <span>Construction Communities & Hubs</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Specialized Engineering & Builder Groups
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed">
              Connect with fellow builders, homeowners, and verified structural engineers across Sri Lanka.
              Exchange blueprints, compare supplier rates, and troubleshoot site challenges together.
            </p>
          </div>
          {/* Subtle background icon */}
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 pointer-events-none hidden md:block">
            <Building2 className="w-80 h-80 text-white" />
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Tabs */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'discover'
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Discover Groups</span>
            </button>
            <button
              onClick={() => setActiveTab('my-groups')}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my-groups'
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>My Groups</span>
              {groups.filter((g) => g.isMember).length > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] flex items-center justify-center font-bold">
                  {groups.filter((g) => g.isMember).length}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups by keyword..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                selectedCategory === cat
                  ? 'bg-brand-navy text-white shadow'
                  : 'bg-white text-slate-700 hover:text-brand-blue hover:border-brand-blue border border-slate-200'
              }`}
            >
              {cat === 'ALL' ? '🌐 All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl h-80 animate-pulse shadow-sm"
              />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-3 shadow-sm">
            <Users className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-bold text-base text-slate-900">No groups found</h3>
            <p className="text-xs text-slate-500">
              {activeTab === 'my-groups'
                ? "You haven't joined any construction groups yet. Browse the Discover tab to find communities!"
                : 'Try adjusting your search terms or filter category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Cover Image */}
                <div className="h-36 bg-slate-100 relative overflow-hidden">
                  {group.coverImage ? (
                    <img
                      src={group.coverImage}
                      alt={group.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-navy/80 to-brand-blue/80 flex items-center justify-center text-3xl">
                      {group.icon || '🏗️'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  <span className="absolute top-3 left-3 bg-white/95 text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full border border-slate-200 shadow-md flex items-center space-x-1.5">
                    <span>{group.icon || '🏗️'}</span>
                    <span>{group.category}</span>
                  </span>

                  {group.locationDistrict && (
                    <span className="absolute top-3 right-3 bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1 border border-white/20">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      <span>{group.locationDistrict}</span>
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-brand-blue transition-colors line-clamp-1">
                      {group.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {group.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-brand-blue" />
                      <span className="font-bold text-slate-900">
                        {group.membersCount.toLocaleString()}
                      </span>
                      <span>members</span>
                    </div>

                    <div className="flex items-center space-x-1 font-medium">
                      <span>{group.postsCount} posts</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleToggleJoin(group.id)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-98 shadow-xs ${
                        group.isMember
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                          : 'bg-brand-blue hover:bg-blue-700 text-white shadow-sm'
                      }`}
                    >
                      {group.isMember ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Joined</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Join Group</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/feed?category=${encodeURIComponent(group.category)}`}
                      className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center justify-center space-x-1 transition-all active:scale-98"
                    >
                      <span>View Feed</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
