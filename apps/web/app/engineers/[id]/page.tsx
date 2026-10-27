'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import {
  EngineerDirectoryItemDto,
  ConsultationType,
  ConsultationStatus,
  ConsultationDto,
  ConsultationMessageDto,
  EngineerReviewDto,
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
  MessageSquare,
  ThumbsUp,
  MessageCircle,
} from 'lucide-react';

export default function EngineerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const engineerId = params?.id as string;

  const [engineer, setEngineer] = useState<EngineerDirectoryItemDto | null>(null);
  const [reviews, setReviews] = useState<EngineerReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Consultations for current user
  const [myConsultations, setMyConsultations] = useState<ConsultationDto[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<ConsultationDto | null>(null);
  const [messages, setMessages] = useState<ConsultationMessageDto[]>([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [consultationType, setConsultationType] = useState<ConsultationType>(ConsultationType.ONSITE);
  const [scheduledAt, setScheduledAt] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  const fetchEngineerData = async () => {
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
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${apiUrl}/engineers/${engineerId}/reviews`);
      const data = await res.json();
      if (data.success && data.data) {
        setReviews(data.data);
      }
    } catch {
      // ignore
    }
  };

  const fetchUserConsultations = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/engineers/consultations/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMyConsultations(data.data);
        const match = data.data.find(
          (c: ConsultationDto) => c.engineerId === engineerId
        );
        if (match) {
          setActiveConsultation(match);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!engineerId) return;

    setLoading(true);
    Promise.all([fetchEngineerData(), fetchReviews(), fetchUserConsultations()]).finally(() => {
      setLoading(false);
    });
  }, [engineerId, token]);

  const fetchMessages = async (consultationId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/engineers/consultations/${consultationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch {
      // ignore
    }
  };

  const handleOpenChat = () => {
    if (!activeConsultation) return;
    setShowChatModal(true);
    fetchMessages(activeConsultation.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeConsultation || !token) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch(`${apiUrl}/engineers/consultations/${activeConsultation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: chatMessage.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages((prev) => [...prev, data.data]);
        setChatMessage('');
      }
    } catch {
      // ignore
    } finally {
      setIsSendingMessage(false);
    }
  };

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
        setActiveConsultation(data.data);
        fetchUserConsultations();
      } else {
        setBookingError(data?.error?.message || 'Failed to submit booking');
      }
    } catch {
      setBookingError('Network error while booking consultation');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      router.push(`/login?redirect=/engineers/${engineerId}`);
      return;
    }

    if (!reviewText.trim()) {
      setReviewError('Please write your review feedback.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');

    try {
      const res = await fetch(`${apiUrl}/engineers/${engineerId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          reviewText: reviewText.trim(),
          consultationId: activeConsultation?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowReviewModal(false);
        setReviewText('');
        fetchReviews();
        fetchEngineerData();
      } else {
        setReviewError(data?.error?.message || 'Failed to submit review');
      }
    } catch {
      setReviewError('Network error while submitting review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-brand-muted">
          Loading verified engineer profile and credentials...
        </p>
      </div>
    );
  }

  if (error || !engineer) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-brand-error text-sm">
          {error || 'Engineer profile could not be found'}
        </div>
        <Link href="/engineers" className="btn-secondary text-xs inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Engineers Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Back button */}
      <div>
        <Link
          href="/engineers"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-muted hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Verified Directory
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="card-primary p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-border">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-brand-navy to-brand-blue text-white flex items-center justify-center font-black text-3xl shadow-lg shrink-0">
              {engineer.displayName?.[0] || 'E'}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-brand-navy">
                  {engineer.displayName}
                </h1>
                <span className="badge-verified flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified IESL / CIDA
                </span>
              </div>

              <p className="text-sm font-bold text-brand-blue">{engineer.title}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-brand-muted pt-1">
                <span className="flex items-center gap-1 font-bold text-amber-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {engineer.ratingAverage > 0 ? engineer.ratingAverage.toFixed(1) : 'New'}
                  <span className="text-brand-muted font-normal">
                    ({engineer.ratingCount} reviews)
                  </span>
                </span>

                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                  {engineer.city ? `${engineer.city}, ${engineer.district}` : engineer.district}
                </span>

                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-brand-blue" />
                  {engineer.yearsOfExperience} Years Experience
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
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
              className="btn-accent text-sm font-bold px-5 py-2.5 shadow-md gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book Consultation
            </button>

            {activeConsultation && (
              <button
                onClick={handleOpenChat}
                className="btn-primary text-sm font-bold px-4 py-2.5 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <MessageSquare className="w-4 h-4" />
                In-App Chat
              </button>
            )}
          </div>
        </div>

        {/* Credentials & Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
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

      {/* Phase 9: Verified Client Reviews Section */}
      <div className="card-primary p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
          <div>
            <h2 className="text-lg font-black text-brand-navy flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              Verified Client Reviews & Inspections ({reviews.length})
            </h2>
            <p className="text-xs text-brand-muted mt-1">
              Feedback from verified Sri Lankan homeowners and developers who completed consultations
            </p>
          </div>

          <button
            onClick={() => {
              if (!token) router.push(`/login?redirect=/engineers/${engineerId}`);
              else setShowReviewModal(true);
            }}
            className="btn-secondary text-xs font-bold px-4 py-2 gap-1.5 shrink-0"
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            Write a Review
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-brand-border space-y-3">
            <MessageCircle className="w-8 h-8 text-brand-muted mx-auto" />
            <p className="text-xs font-bold text-brand-navy">No client reviews yet</p>
            <p className="text-xs text-brand-muted max-w-sm mx-auto">
              Be the first verified client to book a site visit or consultation and rate {engineer.displayName}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-white border border-brand-border shadow-xs space-y-3 hover:border-brand-blue/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-brand-navy font-bold text-xs flex items-center justify-center">
                      {rev.clientName?.[0] || 'C'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-brand-navy block">
                        {rev.clientName || 'Verified Homeowner'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Client Inspection
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-brand-text leading-relaxed">
                  "{rev.reviewText}"
                </p>

                <div className="text-[10px] text-brand-muted pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>{new Date(rev.createdAt).toLocaleDateString('en-LK', { dateStyle: 'medium' })}</span>
                  <span className="text-brand-blue font-bold">Audited Feedback</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
                  Your request has been submitted to {engineer.displayName}. You can now exchange direct in-app messages in the consultation thread.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setShowBookingModal(false);
                      handleOpenChat();
                    }}
                    className="btn-accent text-xs font-bold px-4 py-2"
                  >
                    Open In-App Chat
                  </button>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="btn-secondary text-xs"
                  >
                    Close
                  </button>
                </div>
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

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-brand-border space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">
                  Rate & Review {engineer.displayName}
                </h3>
                <p className="text-xs text-brand-muted">
                  Share your experience regarding engineering rigor, responsiveness, and report quality
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-brand-muted hover:text-brand-navy font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {reviewError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-brand-error text-xs">
                  {reviewError}
                </div>
              )}

              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-brand-navy ml-2">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-1">
                  Detailed Inspection & Feedback *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Describe the consultation quality, accuracy of structural or architectural advice, compliance with Sri Lankan standards..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-brand-blue/30 text-[11px] text-brand-blue">
                Reviews are marked with a Verified Client badge and audited to maintain institutional integrity.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="btn-accent text-xs font-bold px-5 py-2.5"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Post Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Consultation Messaging Drawer / Modal */}
      {showChatModal && activeConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full h-[650px] flex flex-col shadow-2xl border border-brand-border overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-brand-border bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center font-bold">
                  {engineer.displayName?.[0] || 'E'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2">
                    {engineer.displayName}
                    <span className="badge-verified text-[10px] py-0.5">Verified Consultation</span>
                  </h3>
                  <p className="text-[11px] text-brand-muted">
                    Type: {activeConsultation.consultationType} • Status: {activeConsultation.status}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowChatModal(false)}
                className="text-brand-muted hover:text-brand-navy font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            {/* Problem Description Banner */}
            <div className="px-5 py-2.5 bg-blue-50/60 border-b border-blue-100 text-xs text-brand-navy">
              <span className="font-bold text-brand-blue uppercase tracking-wider text-[10px] mr-2">
                Consultation Case:
              </span>
              {activeConsultation.problemDescription}
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/40">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-brand-muted text-xs">
                  No messages exchanged yet. Start the conversation with your engineer!
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-brand-muted">
                        <span className="font-bold text-brand-navy">{m.senderName}</span>
                        <span>•</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                          isMe
                            ? 'bg-brand-blue text-white rounded-br-none shadow-sm'
                            : 'bg-white text-brand-navy border border-brand-border rounded-bl-none shadow-xs'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-line">{m.content}</p>
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
                            {m.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] underline block truncate hover:opacity-80"
                              >
                                📎 Attachment #{idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-brand-border bg-white flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message, structural query, or site update..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <button
                type="submit"
                disabled={isSendingMessage || !chatMessage.trim()}
                className="btn-accent px-4 py-2.5 text-xs font-bold gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
