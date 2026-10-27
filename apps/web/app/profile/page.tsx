'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import {
  UserRole,
  VerificationStatus,
  CONSTRUCTION_CATEGORIES,
  SRI_LANKAN_DISTRICTS,
  PostDto,
  DirectMessageDto,
} from '@buildlink/shared';
import {
  User,
  HardHat,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Phone,
  MapPin,
  Building,
  Award,
  DollarSign,
  Briefcase,
  KeyRound,
  FileCheck2,
  Sparkles,
  Calendar,
  Camera,
  Edit3,
  Share2,
  PlusCircle,
  ImageIcon,
  Users,
  Grid,
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  Globe,
} from 'lucide-react';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, updateUser, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'timeline' | 'about' | 'photos' | 'connections' | 'security'>('timeline');

  // Personal Info Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(
    'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80'
  );
  const [showEditCoverModal, setShowEditCoverModal] = useState(false);
  const [newCoverInput, setNewCoverInput] = useState('');

  // Engineer Info Form State
  const [engineerTitle, setEngineerTitle] = useState('');
  const [registrationBody, setRegistrationBody] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [availableForConsultation, setAvailableForConsultation] = useState<boolean>(true);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Timeline posts authored by user
  const [myPosts, setMyPosts] = useState<PostDto[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Alerts & Loading
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  // Handle URL tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'about') setActiveTab('about');
    else if (tabParam === 'security') setActiveTab('security');
    else if (tabParam === 'photos') setActiveTab('photos');
    else if (tabParam === 'connections') setActiveTab('connections');
    else if (tabParam === 'timeline') setActiveTab('timeline');
  }, [searchParams]);

  // Populate state when user loads
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile');
      return;
    }

    if (user?.profile) {
      setFirstName(user.profile.firstName || '');
      setLastName(user.profile.lastName || '');
      setDisplayName(user.profile.displayName || '');
      setCity(user.profile.city || '');
      setDistrict(user.profile.district || '');
      setPhoneNumber(user.profile.phoneNumber || '');
      setBio(user.profile.bio || '');
      if (user.profile.coverPhotoUrl) {
        setCoverPhoto(user.profile.coverPhotoUrl);
      }
    }

    if (user?.engineerProfile) {
      setEngineerTitle(user.engineerProfile.title || '');
      setRegistrationBody(user.engineerProfile.registrationBody || '');
      setRegistrationNumber(user.engineerProfile.registrationNumber || '');
      setYearsOfExperience(user.engineerProfile.yearsOfExperience || 0);
      setConsultationFee(user.engineerProfile.consultationFee || 0);
      setAvailableForConsultation(user.engineerProfile.availableForConsultation ?? true);
      setSelectedSpecializations(user.engineerProfile.specializations || []);
    }
  }, [user, authLoading, router]);

  // Load user's timeline posts
  useEffect(() => {
    if (!user) return;
    const loadUserPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await fetch(`${apiUrl}/posts?authorId=${user.id}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setMyPosts(data.data);
        }
      } catch {
        // Handled silently
      } finally {
        setLoadingPosts(false);
      }
    };
    loadUserPosts();
  }, [user]);

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSaving(true);

    try {
      const res = await fetch(`${apiUrl}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          displayName,
          city,
          district,
          phoneNumber,
          bio,
          coverPhotoUrl: coverPhoto,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to update personal profile.');
      }

      updateUser(data.data);
      setStatusMessage({
        type: 'success',
        text: 'Personal profile details updated successfully.',
      });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error updating profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEngineerInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSaving(true);

    try {
      const res = await fetch(`${apiUrl}/users/engineer-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: engineerTitle,
          registrationBody,
          registrationNumber,
          yearsOfExperience: Number(yearsOfExperience),
          consultationFee: Number(consultationFee),
          availableForConsultation,
          specializations: selectedSpecializations,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to update engineer credentials.');
      }

      updateUser(data.data);
      setStatusMessage({
        type: 'success',
        text: 'Engineer professional credentials updated successfully.',
      });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error updating engineer profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword !== confirmPassword) {
      setStatusMessage({
        type: 'error',
        text: 'New passwords do not match. Please verify.',
      });
      return;
    }

    if (newPassword.length < 8) {
      setStatusMessage({
        type: 'error',
        text: 'New password must be at least 8 characters long.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to change password.');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage({
        type: 'success',
        text: 'Password updated successfully. Use your new password on next sign-in.',
      });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error changing password.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    if (selectedSpecializations.includes(spec)) {
      setSelectedSpecializations(selectedSpecializations.filter((s) => s !== spec));
    } else {
      setSelectedSpecializations([...selectedSpecializations, spec]);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const initials =
    displayName.substring(0, 2).toUpperCase() ||
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() ||
    'BL';

  const isEngineer = user.role === UserRole.ENGINEER;
  const isVerifiedEngineer =
    isEngineer && user.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED;

  // Site Photos collected from user's posts
  const sitePhotos = myPosts.flatMap((p) => p.mediaUrls || []);

  return (
    <div className="min-h-screen bg-brand-bg pb-12">
      {/* ========================================================
          1. FACEBOOK COVER PHOTO BANNER & OVERLAPPING AVATAR
         ======================================================== */}
      <div className="bg-brand-surface border-b border-brand-border shadow-sm">
        <div className="max-w-6xl mx-auto">
          {/* Cover Photo */}
          <div className="relative h-60 sm:h-80 w-full overflow-hidden bg-brand-card">
            <img
              src={coverPhoto}
              alt="Profile Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Edit Cover Photo Button */}
            <button
              onClick={() => setShowEditCoverModal(true)}
              className="absolute bottom-4 right-4 bg-brand-surface/90 hover:bg-brand-surface backdrop-blur-md text-brand-text text-xs font-semibold px-3 py-2 rounded-xl shadow border border-brand-border flex items-center space-x-1.5 transition-all"
            >
              <Camera className="w-4 h-4 text-brand-primary" />
              <span>Edit Cover Photo</span>
            </button>
          </div>

          {/* Profile Header Details (Overlapping Facebook Avatar) */}
          <div className="px-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4">
              
              {/* Avatar + Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-3 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
                {/* Circular Overlapping Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full ring-4 ring-brand-surface overflow-hidden bg-brand-surface shadow-xl flex items-center justify-center text-3xl font-extrabold text-brand-primary bg-brand-primary/10">
                    {user.profile?.avatarUrl ? (
                      <img
                        src={user.profile.avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  {/* Online presence green badge */}
                  <span className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-brand-surface" />
                </div>

                {/* Name & Title */}
                <div className="space-y-1 pb-2">
                  <div className="flex items-center space-x-2 justify-center sm:justify-start">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text">
                      {displayName || `${firstName} ${lastName}`.trim() || 'BuildLink User'}
                    </h1>
                    {isVerifiedEngineer && (
                      <span className="inline-flex items-center text-emerald-500" title="IESL Verified Engineer">
                        <ShieldCheck className="w-6 h-6" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-brand-muted font-medium">
                    {isEngineer ? (
                      <span className="text-brand-primary font-semibold">
                        {engineerTitle || 'Certified Construction Engineer'}
                      </span>
                    ) : (
                      <span>Homeowner & Builder</span>
                    )}
                    {district && <span> • 📍 {district}, Sri Lanka</span>}
                  </p>

                  <p className="text-xs text-brand-muted max-w-md">
                    {bio || 'Building stronger homes & communities in Sri Lanka.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end space-x-2.5 pb-2">
                <button
                  onClick={() => setActiveTab('about')}
                  className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold flex items-center space-x-1.5 shadow transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <Link
                  href="/feed"
                  className="px-4 py-2 rounded-xl bg-brand-card hover:bg-brand-border/40 text-brand-text text-xs font-semibold border border-brand-border flex items-center space-x-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Add Story</span>
                </Link>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Profile link copied to clipboard!');
                  }}
                  className="p-2 rounded-xl bg-brand-card hover:bg-brand-border/40 text-brand-text border border-brand-border transition-colors"
                  title="Share profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Facebook Horizontal Navigation Tabs */}
            <div className="mt-6 pt-2 border-t border-brand-border flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none text-xs font-semibold">
              {[
                { id: 'timeline', label: 'Timeline / Posts' },
                { id: 'about', label: 'About & Credentials' },
                { id: 'photos', label: `Photos (${sitePhotos.length})` },
                { id: 'connections', label: 'Connections' },
                { id: 'security', label: 'Security & Password' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-brand-primary/10 text-brand-primary border-b-2 border-brand-primary font-bold'
                      : 'text-brand-muted hover:text-brand-text hover:bg-brand-card'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================
          2. TAB CONTENTS
         ======================================================== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Alerts */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-xs font-medium mb-6 flex items-center space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-600 border border-red-500/30'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* --- TAB 1: TIMELINE (Facebook Wall Layout) --- */}
        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Intro Column */}
            <div className="lg:col-span-5 space-y-5">
              {/* Intro Card */}
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-brand-text">Intro</h3>
                <p className="text-xs text-brand-text/90 leading-relaxed">
                  {bio || 'Welcome to my BuildLink profile. Sharing updates on active Sri Lankan construction projects.'}
                </p>

                <div className="space-y-2.5 pt-2 border-t border-brand-border/60 text-xs text-brand-muted">
                  <div className="flex items-center space-x-2.5">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>
                      Lives in <strong className="text-brand-text">{city || 'Colombo'}, {district || 'Western Province'}</strong>
                    </span>
                  </div>

                  {isEngineer && (
                    <>
                      <div className="flex items-center space-x-2.5">
                        <HardHat className="w-4 h-4 text-amber-500" />
                        <span>
                          <strong className="text-brand-text">{engineerTitle || 'Engineer'}</strong> at BuildLink Pro
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Award className="w-4 h-4 text-brand-primary" />
                        <span>
                          {registrationBody || 'IESL'} Reg. #{registrationNumber || '104829'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span>Consultation: LKR {consultationFee?.toLocaleString() || '3,500'}/hr</span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center space-x-2.5">
                    <Calendar className="w-4 h-4 text-cyan-500" />
                    <span>
                      Joined <strong className="text-brand-text">{new Date(user.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })}</strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('about')}
                  className="w-full py-2 bg-brand-card hover:bg-brand-border/40 text-brand-text text-xs font-semibold rounded-xl border border-brand-border transition-colors"
                >
                  Edit Details
                </button>
              </div>

              {/* Photos Widget */}
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-brand-text">Site Photos</h3>
                  <button onClick={() => setActiveTab('photos')} className="text-xs text-brand-primary font-semibold hover:underline">
                    See all
                  </button>
                </div>

                {sitePhotos.length === 0 ? (
                  <p className="text-xs text-brand-muted py-4 text-center">No photos uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {sitePhotos.slice(0, 6).map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-brand-card">
                        <img src={img} alt={`Photo ${i}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Stream Column (Posts authored by user) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Mini Composer */}
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {initials}
                </div>
                <Link
                  href="/feed"
                  className="flex-1 bg-brand-bg hover:bg-brand-card px-4 py-2.5 rounded-full text-xs text-brand-muted border border-brand-border transition-colors truncate"
                >
                  Post an update on your timeline...
                </Link>
              </div>

              {/* User Posts List */}
              {loadingPosts ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-brand-surface border border-brand-border rounded-2xl h-48 animate-pulse" />
                  ))}
                </div>
              ) : myPosts.length === 0 ? (
                <div className="bg-brand-surface border border-brand-border rounded-2xl p-12 text-center space-y-3">
                  <Building className="w-10 h-10 text-brand-muted mx-auto" />
                  <h4 className="font-bold text-sm text-brand-text">No posts on your timeline yet</h4>
                  <p className="text-xs text-brand-muted">Share project milestones, site photos, or structural questions.</p>
                  <Link
                    href="/feed"
                    className="inline-block px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold"
                  >
                    Go to Feed
                  </Link>
                </div>
              ) : (
                myPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-brand-surface border border-brand-border rounded-2xl p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-xs">
                        {initials}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-brand-text">{post.author.displayName}</p>
                        <p className="text-[10px] text-brand-muted">
                          {new Date(post.createdAt).toLocaleDateString()} • {post.category}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-brand-text">{post.title}</h4>
                      <p className="text-xs text-brand-text/90 leading-relaxed">{post.content}</p>
                    </div>

                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <div className="rounded-xl overflow-hidden max-h-72 bg-black">
                        <img
                          src={post.mediaUrls[0]}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-xs text-brand-muted">
                      <span>👍 {post.likesCount} reactions</span>
                      <span>💬 {post.commentsCount} comments</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* --- TAB 2: ABOUT & CREDENTIALS --- */}
        {activeTab === 'about' && (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
            {/* Personal Details */}
            <form onSubmit={handleSavePersonalInfo} className="space-y-5">
              <div className="border-b border-brand-border/60 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-brand-text">Personal Profile Details</h3>
                  <p className="text-xs text-brand-muted">Update your public identity on BuildLink.</p>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl shadow disabled:opacity-40"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-brand-muted uppercase mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-brand-bg text-brand-text rounded-xl px-3.5 py-2 border border-brand-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-brand-muted uppercase mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-brand-bg text-brand-text rounded-xl px-3.5 py-2 border border-brand-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-brand-muted uppercase mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-brand-bg text-brand-text rounded-xl px-3.5 py-2 border border-brand-border focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-brand-muted uppercase mb-1">District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-brand-bg text-brand-text rounded-xl px-3.5 py-2 border border-brand-border focus:outline-none"
                  >
                    <option value="">Select District</option>
                    {SRI_LANKAN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-bold text-brand-muted uppercase mb-1">Bio / Headline</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-brand-bg text-brand-text rounded-xl p-3 border border-brand-border focus:outline-none"
                />
              </div>
            </form>

            {/* Engineer Credentials (If Engineer Role) */}
            {isEngineer && (
              <form onSubmit={handleSaveEngineerInfo} className="space-y-5 pt-6 border-t border-brand-border">
                <div className="border-b border-brand-border/60 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-brand-text">Professional Engineer Credentials</h3>
                    <p className="text-xs text-brand-muted">License, IESL affiliation, and technical rates.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl shadow disabled:opacity-40"
                  >
                    {isSaving ? 'Saving...' : 'Save Credentials'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-brand-muted uppercase mb-1">Professional Title</label>
                    <input
                      type="text"
                      value={engineerTitle}
                      onChange={(e) => setEngineerTitle(e.target.value)}
                      placeholder="e.g., Chartered Structural Engineer"
                      className="w-full bg-brand-bg text-brand-text rounded-xl px-3.5 py-2 border border-brand-border focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-muted uppercase mb-1">Registration Body</label>
                    <input
                      type="text"
                      value={registrationBody}
                      onChange={(e) => setRegistrationBody(e.target.value)}
                      placeholder="IESL / CIBSE / SOE"
                      className="w-full bg-brand-bg text-brand-text rounded-xl px-3.5 py-2 border border-brand-border focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-muted uppercase mb-1">Registration Number</label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className="w-full bg-brand-bg text-brand-text rounded-xl px-3.5 py-2 border border-brand-border focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-muted uppercase mb-1">Consultation Hourly Rate (LKR)</label>
                    <input
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(Number(e.target.value))}
                      className="w-full bg-brand-bg text-brand-text rounded-xl px-3.5 py-2 border border-brand-border focus:outline-none"
                    />
                  </div>
                </div>

                {/* Specializations Pills */}
                <div className="space-y-2 text-xs">
                  <label className="block font-bold text-brand-muted uppercase">Engineering Specializations</label>
                  <div className="flex flex-wrap gap-2">
                    {CONSTRUCTION_CATEGORIES.map((cat) => {
                      const selected = selectedSpecializations.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleSpecialization(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            selected
                              ? 'bg-brand-primary text-white'
                              : 'bg-brand-bg text-brand-muted hover:text-brand-text border border-brand-border'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* --- TAB 3: PHOTOS GALLERY --- */}
        {activeTab === 'photos' && (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-brand-text">Site Photos & Technical Blueprints</h3>
                <p className="text-xs text-brand-muted">All visual records posted across your timeline & milestones.</p>
              </div>
            </div>

            {sitePhotos.length === 0 ? (
              <div className="p-12 text-center text-xs text-brand-muted space-y-2">
                <ImageIcon className="w-10 h-10 text-brand-muted mx-auto" />
                <p>No photos uploaded yet. Attach images to your feed posts to populate your site gallery.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {sitePhotos.map((img, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-brand-card shadow group relative">
                    <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 4: CONNECTIONS & FRIENDS --- */}
        {activeTab === 'connections' && (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-brand-text">Connected Engineers & Builders</h3>
                <p className="text-xs text-brand-muted">Your professional network for direct collaboration.</p>
              </div>
              <Link
                href="/engineers"
                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl shadow"
              >
                Find Engineers
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  name: 'Eng. Kasun Perera',
                  title: 'Structural Engineer (IESL)',
                  district: 'Kandy',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                },
                {
                  name: 'Arch. Nimali Silva',
                  title: 'Chartered Architect',
                  district: 'Galle',
                  avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
                },
                {
                  name: 'Eng. Ruwan Jayawardena',
                  title: 'NBRO Geotechnical Consultant',
                  district: 'Nuwara Eliya',
                  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
                },
              ].map((conn, i) => (
                <div key={i} className="bg-brand-bg border border-brand-border rounded-xl p-4 flex items-center space-x-3">
                  <img src={conn.avatar} alt={conn.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-border" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-brand-text truncate">{conn.name}</p>
                    <p className="text-[10px] text-brand-muted truncate">{conn.title}</p>
                    <p className="text-[9px] text-emerald-500 font-semibold">📍 {conn.district}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 5: SECURITY & PASSWORD --- */}
        {activeTab === 'security' && (
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-xl">
            <div>
              <h3 className="font-bold text-base text-brand-text">Change Password</h3>
              <p className="text-xs text-brand-muted">Secure your BuildLink account with a strong password.</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-brand-muted uppercase mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-brand-bg text-brand-text rounded-xl px-3.5 py-2 border border-brand-border focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-brand-muted uppercase mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-brand-bg text-brand-text rounded-xl px-3.5 py-2 border border-brand-border focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-brand-muted uppercase mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-brand-bg text-brand-text rounded-xl px-3.5 py-2 border border-brand-border focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-brand-primary text-white font-bold shadow disabled:opacity-40"
              >
                {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* ========================================================
          EDIT COVER PHOTO MODAL
         ======================================================== */}
      {showEditCoverModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Update Profile Cover Photo</h3>
              <button
                type="button"
                onClick={() => setShowEditCoverModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-600">Enter a direct image URL or choose one of our construction presets.</p>

            <input
              type="url"
              value={newCoverInput}
              onChange={(e) => setNewCoverInput(e.target.value)}
              placeholder="https://images.unsplash.com/... or paste image URL"
              className="w-full bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-3.5 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />

            <div className="space-y-2">
              <span className="font-bold text-slate-700">Preset Construction Covers:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=600&q=80',
                  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80',
                  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80',
                ].map((preset, idx) => (
                  <img
                    key={idx}
                    src={preset}
                    alt="Preset"
                    onClick={() => setNewCoverInput(preset)}
                    className="h-16 w-full object-cover rounded-lg border border-slate-200 hover:ring-2 hover:ring-brand-blue cursor-pointer"
                  />
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowEditCoverModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newCoverInput.trim()) {
                    setCoverPhoto(newCoverInput.trim());
                  }
                  setShowEditCoverModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold shadow-md"
              >
                Apply Cover Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-brand-muted">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
