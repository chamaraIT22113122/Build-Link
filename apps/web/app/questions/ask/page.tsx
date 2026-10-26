'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import {
  PostType,
  CONSTRUCTION_CATEGORIES,
} from '@buildlink/shared';
import {
  HelpCircle,
  UploadCloud,
  X,
  AlertTriangle,
  Flame,
  Clock,
  ShieldCheck,
  Building2,
  Check,
  ArrowLeft,
  Info,
} from 'lucide-react';

export default function AskQuestionPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>(CONSTRUCTION_CATEGORIES[0]);
  const [urgency, setUrgency] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');
  const [location, setLocation] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  // Upload Photo
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploadingMedia(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${apiUrl}/posts/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.fileUrl) {
        setMediaUrls((prev) => [...prev, data.data.fileUrl]);
      } else {
        setErrorMsg('Failed to upload image. Please ensure image is under 10MB.');
      }
    } catch {
      setErrorMsg('Error connecting to image upload service.');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  // Submit Question
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      router.push('/login?redirect=/questions/ask');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setErrorMsg('Please provide a specific title and problem description.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content: `${content}${location ? `\n\nSite Location: ${location}` : ''}`,
          category,
          postType: PostType.QUESTION,
          isQuestion: true,
          urgency,
          mediaUrls,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/questions?tab=unresolved');
      } else {
        setErrorMsg(data?.error?.message || 'Failed to submit question.');
      }
    } catch {
      setErrorMsg('Network error while submitting question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/questions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Questions Hub
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-brand-navy via-[#122e53] to-brand-blue text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-orange text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-brand-orange" />
            Engineering Help Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ask a Construction & Engineering Question
          </h1>
          <p className="mt-2 text-blue-100 text-xs sm:text-sm leading-relaxed">
            Describe the structural or site challenge in detail. Once verified Sri Lankan engineers reply, you can accept the best answer as the verified solution.
          </p>
        </div>

        <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-brand-orange/20 blur-2xl" />
      </div>

      {/* Guidelines info */}
      <div className="bg-blue-50/70 border border-brand-blue/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-xs text-brand-navy">
        <Info className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Tips for getting fast, accurate engineer responses:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-brand-text">
            <li>State dimensions, materials, and concrete age whenever possible.</li>
            <li>Attach clear photos showing the context and close-up views of cracks or joints.</li>
            <li>Specify whether work is already completed or currently under planning.</li>
          </ul>
        </div>
      </div>

      {/* Main Question Form */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-sm">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-brand-error text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">
              Question Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep horizontal diagonal cracks in 2nd floor reinforced lintel beam - Colombo 05"
              className="w-full px-4 py-3 rounded-xl border border-brand-border text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {/* Category & Urgency Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">
                Construction Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {CONSTRUCTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-brand-orange" /> Urgency Level *
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="NORMAL">Standard / Normal Timeline</option>
                <option value="URGENT">Urgent (Need advice within 24h)</option>
                <option value="EMERGENCY">Critical / Emergency Site Risk</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">
              Site Location / City (Optional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Kandy, Central Province"
              className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {/* Content Description */}
          <div>
            <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider mb-2">
              Detailed Problem Description *
            </label>
            <textarea
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the issue in full detail: When did it start? What materials were used? Any water ingress or soil movement? What advice or remedies are you looking for?"
              className="w-full px-4 py-3 rounded-xl border border-brand-border text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {/* Photo Attachments */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-brand-navy uppercase tracking-wider">
              Attach Site Photos or Plans (Max 5 images)
            </label>

            <label className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-brand-border rounded-2xl cursor-pointer hover:border-brand-blue hover:bg-blue-50/20 transition-all">
              <UploadCloud className="w-8 h-8 text-brand-blue mb-2" />
              <p className="text-xs font-bold text-brand-navy">
                {isUploadingMedia ? 'Uploading image...' : 'Click to upload site photo'}
              </p>
              <p className="text-[11px] text-brand-muted mt-0.5">
                Supports PNG, JPG, WebP up to 10MB
              </p>
              <input
                type="file"
                accept="image/*"
                disabled={isUploadingMedia || mediaUrls.length >= 5}
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {mediaUrls.length > 0 && (
              <div className="flex gap-3 overflow-x-auto py-2">
                {mediaUrls.map((url, i) => (
                  <div
                    key={i}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border border-brand-border flex-shrink-0 group"
                  >
                    <img
                      src={url}
                      alt={`Upload preview ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-brand-border flex items-center justify-end gap-3">
            <Link href="/questions" className="btn-secondary text-xs">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingMedia}
              className="btn-accent text-xs font-bold px-6 py-2.5 shadow-md flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              {isSubmitting ? 'Posting Question...' : 'Post Technical Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
