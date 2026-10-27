'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import {
  EngineerDirectoryItemDto,
  EngineerReviewDto,
} from '@buildlink/shared';
import {
  ShieldCheck,
  Star,
  MapPin,
  Briefcase,
  CheckCircle2,
  ArrowLeft,
  Building,
  Award,
  MessageCircle,
  UserPlus,
  Check,
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
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

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

  const checkConnection = async (targetUserId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/messages/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const found = data.data.some((c: any) => c.connectedUserId === targetUserId);
        setIsConnected(found);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!engineerId) return;

    setLoading(true);
    Promise.all([fetchEngineerData(), fetchReviews()]).finally(() => {
      setLoading(false);
    });
  }, [engineerId]);

  useEffect(() => {
    if (engineer?.userId && token) {
      checkConnection(engineer.userId);
    }
  }, [engineer?.userId, token]);

  const handleConnect = async () => {
    if (!token) {
      router.push(`/login?redirect=/engineers/${engineerId}`);
      return;
    }
    if (!engineer?.userId) return;

    setIsConnecting(true);
    try {
      const res = await fetch(`${apiUrl}/messages/connect/${engineer.userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setIsConnected(true);
      }
    } catch {
      // ignore
    } finally {
      setIsConnecting(false);
    }
  };

  const handleMessage = () => {
    if (!token) {
      router.push(`/login?redirect=/messages?userId=${engineer?.userId}`);
      return;
    }
    router.push(`/messages?userId=${engineer?.userId}`);
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
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Engineers
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
          <ArrowLeft className="w-4 h-4" /> Back to Engineers
        </Link>
      </div>

      {/* Main Profile Card (Facebook Style Profile) */}
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

          {/* Facebook-style Direct Actions */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleMessage}
              className="btn-primary text-sm font-bold px-6 py-3 shadow-md gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Message Engineer
            </button>

            <button
              onClick={handleConnect}
              disabled={isConnected || isConnecting}
              className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all ${
                isConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                  : 'bg-white border-brand-border text-brand-navy hover:bg-slate-50'
              }`}
            >
              {isConnected ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" /> Connected
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-brand-muted" /> Add / Connect
                </>
              )}
            </button>
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

      {/* Verified Reviews Section */}
      <div className="card-primary p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
          <div>
            <h2 className="text-lg font-black text-brand-navy flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              Verified Reviews & Testimonials ({reviews.length})
            </h2>
            <p className="text-xs text-brand-muted mt-1">
              Feedback from Sri Lankan homeowners and developers who collaborated with {engineer.displayName}
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
            <Star className="w-8 h-8 text-brand-muted mx-auto" />
            <p className="text-xs font-bold text-brand-navy">No reviews yet</p>
            <p className="text-xs text-brand-muted max-w-sm mx-auto">
              Be the first to leave a review for {engineer.displayName}.
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
                        {rev.clientName || 'Homeowner'}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Review
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
                  <span className="text-brand-blue font-bold">Community Feedback</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                  Share your experience regarding responsiveness, structural quality, and advice
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
                  Detailed Feedback *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Describe your experience, technical guidance, structural advice, and professional responsiveness..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
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
                  {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
