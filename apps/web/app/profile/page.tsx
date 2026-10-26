'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import {
  UserRole,
  VerificationStatus,
  CONSTRUCTION_CATEGORIES,
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
} from 'lucide-react';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, updateUser, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'personal' | 'engineer' | 'security' | 'account'>('personal');

  // Personal Info Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');

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
    if (tabParam === 'engineer' && user?.role === UserRole.ENGINEER) {
      setActiveTab('engineer');
    } else if (tabParam === 'security') {
      setActiveTab('security');
    } else if (tabParam === 'account') {
      setActiveTab('account');
    }
  }, [searchParams, user]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  const initials =
    user.profile?.firstName && user.profile?.lastName
      ? `${user.profile.firstName[0]}${user.profile.lastName[0]}`.toUpperCase()
      : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner Profile Summary */}
      <div className="bg-gradient-to-r from-brand-navy via-[#14325c] to-brand-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar Bubble */}
          <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-extrabold text-white shadow-inner flex-shrink-0">
            {initials}
          </div>

          <div className="flex-grow text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {user.profile?.displayName || `${user.profile?.firstName} ${user.profile?.lastName}`}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === UserRole.ENGINEER
                    ? 'bg-brand-orange text-white'
                    : 'bg-white/20 text-white'
                }`}
              >
                {user.role === UserRole.ENGINEER ? (
                  <>
                    <HardHat className="w-3.5 h-3.5" /> Engineer
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5" /> Homeowner
                  </>
                )}
              </span>

              {user.role === UserRole.ENGINEER && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user.engineerProfile?.verificationStatus === VerificationStatus.VERIFIED
                    ? 'Verified Professional'
                    : 'Verification: Pending'}
                </span>
              )}
            </div>

            <p className="text-blue-100 text-sm mb-3">{user.email}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-blue-200">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-orange" />
                {user.profile?.city && user.profile?.district
                  ? `${user.profile.city}, ${user.profile.district}`
                  : 'Location not set'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-300" />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-brand-border mb-8 overflow-x-auto gap-2">
        <button
          onClick={() => {
            setActiveTab('personal');
            setStatusMessage(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'personal'
              ? 'border-brand-blue text-brand-blue bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-brand-muted hover:text-brand-navy'
          }`}
        >
          <User className="w-4 h-4" />
          Personal Info
        </button>

        {user.role === UserRole.ENGINEER && (
          <button
            onClick={() => {
              setActiveTab('engineer');
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'engineer'
                ? 'border-brand-orange text-brand-orange bg-orange-50/50 rounded-t-lg'
                : 'border-transparent text-brand-muted hover:text-brand-navy'
            }`}
          >
            <HardHat className="w-4 h-4" />
            Engineer Credentials
          </button>
        )}

        <button
          onClick={() => {
            setActiveTab('security');
            setStatusMessage(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-brand-blue text-brand-blue bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-brand-muted hover:text-brand-navy'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security & Password
        </button>

        <button
          onClick={() => {
            setActiveTab('account');
            setStatusMessage(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'account'
              ? 'border-brand-blue text-brand-blue bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-brand-muted hover:text-brand-navy'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Account & Role
        </button>
      </div>

      {/* Tab 1: Personal Info Form */}
      {activeTab === 'personal' && (
        <form onSubmit={handleSavePersonalInfo} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-brand-border shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">Personal Profile</h2>
            <p className="text-xs text-brand-muted mt-0.5">
              Manage your personal information visible on community questions and comments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy mb-1">Display Name (Public Handle)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sunil Perera"
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1">City / Town</label>
              <div className="relative">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Kandy, Battaramulla"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
                />
                <Building className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1">District</label>
              <div className="relative">
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Colombo, Gampaha"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
                />
                <MapPin className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy mb-1">Phone Number (Optional)</label>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
              />
              <Phone className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy mb-1">Bio & Experience Summary</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other builders and homeowners about your building interests or construction background..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
            />
          </div>

          <div className="pt-4 border-t border-brand-border flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving Changes...' : 'Save Personal Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Professional Engineer Credentials Form */}
      {activeTab === 'engineer' && user.role === UserRole.ENGINEER && (
        <form onSubmit={handleSaveEngineerInfo} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-brand-border shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <HardHat className="w-5 h-5 text-brand-orange" />
              Engineer Professional Details
            </h2>
            <p className="text-xs text-brand-muted mt-0.5">
              These details are showcased to homeowners seeking consultations and structural advice.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1">Professional Title</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={engineerTitle}
                  onChange={(e) => setEngineerTitle(e.target.value)}
                  placeholder="e.g. Chartered Structural Engineer"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
                />
                <Briefcase className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1">Years of Practical Experience</label>
              <input
                type="number"
                min={0}
                max={60}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1">Professional Body</label>
              <div className="relative">
                <input
                  type="text"
                  value={registrationBody}
                  onChange={(e) => setRegistrationBody(e.target.value)}
                  placeholder="e.g. IESL, SOE, CIBSE"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
                />
                <Award className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1">Registration / License Number</label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. M-7821"
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1">
                Consultation Fee (LKR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
                />
                <DollarSign className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
              </div>
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={availableForConsultation}
                  onChange={(e) => setAvailableForConsultation(e.target.checked)}
                  className="w-5 h-5 text-brand-blue rounded border-brand-border focus:ring-brand-blue cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-brand-navy">Available for Consultations</span>
                  <p className="text-xs text-brand-muted">Allow clients to book audio/video or onsite sessions</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy mb-2">
              Areas of Specialization (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-brand-border">
              {CONSTRUCTION_CATEGORIES.map((cat) => {
                const isSelected = selectedSpecializations.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleSpecialization(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-brand-orange text-white shadow-sm'
                        : 'bg-white text-brand-text border border-brand-border hover:border-brand-orange'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-brand-border flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-accent inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Updating...' : 'Save Engineer Credentials'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-brand-border shadow-sm max-w-xl">
          <div>
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-brand-blue" />
              Change Password
            </h2>
            <p className="text-xs text-brand-muted mt-0.5">
              Ensure your account stays protected with a strong, distinct password.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy mb-1">New Password (Min 8 Characters)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
            />
          </div>

          <div className="pt-4 border-t border-brand-border flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Account & Role Overview */}
      {activeTab === 'account' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-brand-border shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">Account Details & Verification Status</h2>
            <p className="text-xs text-brand-muted mt-0.5">
              Review your BuildLink role level and identity status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-brand-border bg-slate-50/70">
              <span className="text-xs font-semibold text-brand-muted uppercase">Assigned Platform Role</span>
              <p className="text-base font-bold text-brand-navy mt-1 flex items-center gap-2">
                {user.role === UserRole.ENGINEER ? (
                  <>
                    <HardHat className="w-4 h-4 text-brand-orange" /> Professional Engineer
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-brand-blue" /> Homeowner / Builder
                  </>
                )}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-brand-border bg-slate-50/70">
              <span className="text-xs font-semibold text-brand-muted uppercase">Account Status</span>
              <p className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {user.status}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-brand-border bg-slate-50/70">
              <span className="text-xs font-semibold text-brand-muted uppercase">User ID</span>
              <p className="text-xs font-mono text-brand-navy mt-1 truncate">{user.id}</p>
            </div>

            <div className="p-4 rounded-xl border border-brand-border bg-slate-50/70">
              <span className="text-xs font-semibold text-brand-muted uppercase">Registered On</span>
              <p className="text-sm font-semibold text-brand-navy mt-1">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {user.role === UserRole.ENGINEER && (
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-orange" />
                  Phase 3 Credential Verification
                </h4>
                <p className="text-xs text-amber-800 mt-1 max-w-xl">
                  Upload your chartered engineering credentials, degree transcript, or registration card to receive the verified badge in the professional directory.
                </p>
              </div>
              <Link
                href="/verify"
                className="btn-accent text-xs whitespace-nowrap"
              >
                Submit Documents
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

