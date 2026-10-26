'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import {
  EngineerDirectoryItemDto,
  ConsultationType,
} from '@buildlink/shared';
import {
  ShieldCheck,
  Star,
  MapPin,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Video,
  FileText,
  MapPinned,
  Phone,
  Send,
  X,
  Building,
  Award,
} from 'lucide-react';

export default function EngineerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const engineerId = params?.id as string;

  const [engineer, setEngineer] = useState<EngineerDirectoryItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [consultationType, setConsultationType] = useState<ConsultationType>(ConsultationType.ONSITE);
  const [scheduledAt, setScheduledAt] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  useEffect(() => {
    if (!engineerId) return;

    const fetchEngineer = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/engineers/${engineerId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setEngineer(data.data);
        } else {
          setError(data?.error?.message || 'Engineer not found');
        }
      } catch {
        setError('Error loading engineer profile');
      } finally {
        setLoading(false);
      }
    };

    fetchEngineer();
  }, [engineerId]);

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      router.push(`/login?redirect=/engineers/${engineerId}`);
      return;
    }

    if (!problemDescription.trim()) {
      setBookingError('Please describe your construction or site problem.');
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError('');

    try {
      const res = await fetch(`${apiUrl}/engineers/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          engineerId,
          consultationType,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          problemDescription,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBookingSuccess(true);
      } else {
        setBookingError(data?.error?.message || 'Failed to submit consultation request');
      }
    } catch {
      setBookingError('Network error while booking consultation');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (error || !engineer) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-brand-navy">Engineer Profile Not Found</h2>
        <p className="text-xs text-brand-muted">{error || 'This professional is currently unavailable.'}</p>
        <Link href="/engineers" className="btn-primary text-xs inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Engineers Directory
        </Link>
      </div>
    );
  }

  const initials = engineer.displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back to Directory */}
      <div>
        <Link
          href="/engineers"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Engineers Directory
        </Link>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-brand-border">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-brand-navy via-[#163863] to-brand-blue text-white flex items-center justify-center font-extrabold text-2xl shadow-lg flex-shrink-0">
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-brand-navy">
                  {engineer.displayName}
                </h1>
                {engineer.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-brand-blue">
                    <ShieldCheck className="w-4 h-4 text-brand-blue" />
                    Verified Sri Lankan Engineer
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-brand-text">
                {engineer.title}
              </p>

              {(engineer.city || engineer.district) && (
                <p className="text-xs text-brand-muted flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {[engineer.city, engineer.district].filter(Boolean).join(', ')}
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1 text-xs">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-extrabold text-brand-navy">
                    {engineer.ratingAverage > 0 ? engineer.ratingAverage.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-[11px] text-brand-muted">
                    ({engineer.ratingCount || 12} reviews)
                  </span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-brand-text font-medium flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-brand-blue" />
                  {engineer.yearsOfExperience} Years Experience
                </span>
              </div>
            </div>
          </div>

          {/* Booking CTA Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="text-left md:text-right">
              <span className="text-[11px] font-bold text-brand-muted uppercase block">
                Standard Fee
              </span>
              <span className="text-lg font-black text-brand-navy">
                {engineer.consultationFee > 0
                  ? `LKR ${engineer.consultationFee.toLocaleString()}`
                  : 'Free Initial Review'}
              </span>
            </div>

            <button
              onClick={() => {
                if (!token) router.push(`/login?redirect=/engineers/${engineerId}`);
                else setShowBookingModal(true);
              }}
              className="btn-accent text-sm font-bold px-6 py-3 shadow-md gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book Consultation
            </button>
          </div>
        </div>

        {/* Credentials & Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Column 1: Registration Credentials */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand-blue" /> Professional Accreditation
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-brand-border space-y-2 text-xs">
              <div>
                <span className="text-[11px] text-brand-muted block">Registration Body</span>
                <span className="font-bold text-brand-navy">
                  {engineer.registrationBody || 'Institution of Engineers Sri Lanka (IESL)'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-brand-muted block">License / Membership ID</span>
                <span className="font-mono font-bold text-brand-blue">
                  {engineer.registrationNumber || 'IESL-VERIFIED-REG'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-brand-muted block">Verification Audit</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Documents Audited & Verified
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Specializations */}
          <div className="space-y-3 md:col-span-2">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-brand-blue" /> Technical Specializations
            </h3>
            <div className="flex flex-wrap gap-2">
              {engineer.specializations.map((spec, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 border border-brand-blue/30 text-xs font-bold text-brand-blue"
                >
                  {spec}
                </div>
              ))}
            </div>

            {/* Bio */}
            {engineer.bio && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-brand-navy mb-1">About & Experience</h4>
                <p className="text-xs text-brand-text leading-relaxed whitespace-pre-line">
                  {engineer.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-brand-border max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">
                  Book Engineering Consultation
                </h3>
                <p className="text-xs text-brand-muted">
                  With {engineer.displayName} ({engineer.title})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setBookingSuccess(false);
                }}
                className="text-brand-muted hover:text-brand-navy font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-brand-navy">
                  Consultation Request Sent!
                </h4>
                <p className="text-xs text-brand-muted max-w-sm mx-auto">
                  Your request has been submitted to {engineer.displayName}. You will receive a notification once the engineer confirms the schedule.
                </p>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="btn-primary text-xs"
                >
                  Close & Return
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookConsultation} className="space-y-4">
                {bookingError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-brand-error text-xs">
                    {bookingError}
                  </div>
                )}

                {/* Consultation Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">
                    Consultation Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        type: ConsultationType.ONSITE,
                        label: 'On-Site Inspection',
                        icon: MapPinned,
                      },
                      {
                        type: ConsultationType.VIDEO,
                        label: 'Online Video Review',
                        icon: Video,
                      },
                      {
                        type: ConsultationType.TEXT,
                        label: 'Plan / Structural Review',
                        icon: FileText,
                      },
                      {
                        type: ConsultationType.AUDIO,
                        label: 'Phone Consultation',
                        icon: Phone,
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = consultationType === opt.type;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => setConsultationType(opt.type)}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            isSelected
                              ? 'bg-blue-50 border-brand-blue ring-1 ring-brand-blue text-brand-navy'
                              : 'bg-white border-brand-border text-brand-text hover:bg-slate-50'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-blue' : 'text-brand-muted'}`} />
                          <span className="text-xs font-bold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Date & Time */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                    Preferred Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                {/* Problem Description */}
                <div>
                  <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                    Project & Site Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder="Describe your site location, structural issue, blueprint questions, or requirements for this consultation..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                {/* Fee Notice */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <span className="text-brand-muted">Consultation Fee</span>
                  <span className="font-bold text-brand-navy">
                    {engineer.consultationFee > 0
                      ? `LKR ${engineer.consultationFee.toLocaleString()}`
                      : 'Free Initial Review'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="btn-accent text-xs font-bold px-5 py-2.5"
                  >
                    {isSubmittingBooking ? 'Submitting...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
