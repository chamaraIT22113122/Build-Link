'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  UserRole,
  VerificationStatus,
  DocumentType,
  VerificationApplicationDto,
} from '@buildlink/shared';
import {
  ShieldCheck,
  HardHat,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  FileCheck,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import Link from 'next/link';

interface UploadedDoc {
  documentType: DocumentType;
  fileUrl: string;
  originalFilename: string;
  fileSizeBytes?: number;
}

function VerificationContent() {
  const router = useRouter();
  const { user, token, refreshUser, isLoading: authLoading } = useAuth();

  const [existingApplication, setExistingApplication] = useState<VerificationApplicationDto | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);

  // Form State
  const [registrationBody, setRegistrationBody] = useState('IESL (Institution of Engineers, Sri Lanka)');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(DocumentType.IESL_MEMBERSHIP_CARD);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);

  // Feedback & Loading
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  // Fetch current application
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/verify');
      return;
    }

    if (user && user.role !== UserRole.ENGINEER && user.role !== UserRole.ADMIN) {
      router.push('/profile');
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${apiUrl}/verification/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setExistingApplication(data.data);
          if (data.data.registrationBody) setRegistrationBody(data.data.registrationBody);
          if (data.data.registrationNumber) setRegistrationNumber(data.data.registrationNumber);
        }
      } catch {
        // Handled silently
      } finally {
        setLoadingApp(false);
      }
    };

    if (token) {
      fetchStatus();
    }
  }, [user, token, authLoading, router, apiUrl]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch(`${apiUrl}/verification/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to upload document.');
      }

      setDocuments((prev) => [
        ...prev,
        {
          documentType: selectedDocType,
          fileUrl: data.data.fileUrl,
          originalFilename: data.data.originalFilename,
          fileSizeBytes: data.data.fileSizeBytes,
        },
      ]);

      setStatusMessage({
        type: 'success',
        text: `Uploaded "${data.data.originalFilename}" successfully.`,
      });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error uploading document.',
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (documents.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Please upload at least one credential document (e.g., IESL membership card or engineering degree).',
      });
      return;
    }

    if (!registrationNumber.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your professional registration license number.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/verification/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          registrationBody,
          registrationNumber,
          notes,
          documents,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to submit verification application.');
      }

      setExistingApplication(data.data);
      await refreshUser();
      setStatusMessage({
        type: 'success',
        text: 'Your credential verification application has been submitted for audit review.',
      });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error submitting application.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingApp) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-navy via-[#102d54] to-brand-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-orange/20 border border-brand-orange/40 flex items-center justify-center text-brand-orange flex-shrink-0">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Engineer Credential Verification
              </h1>
              <span className="bg-brand-orange/20 text-brand-orange border border-brand-orange/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Phase 3
              </span>
            </div>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              BuildLink independently audits engineer credentials against official professional bodies (IESL, CIBSE, SOE) so homeowners can book consultations with verified confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
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

      {/* Case 1: Application already submitted */}
      {existingApplication && (
        <div className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 shadow-sm mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-brand-border">
            <div>
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                Current Audit Status
              </span>
              <div className="flex items-center gap-2.5 mt-1">
                {existingApplication.status === VerificationStatus.VERIFIED && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Verified Professional Engineer
                  </span>
                )}
                {existingApplication.status === VerificationStatus.PENDING_REVIEW && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Pending Audit Review
                  </span>
                )}
                {existingApplication.status === VerificationStatus.ADDITIONAL_INFO_REQUIRED && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    <Info className="w-4 h-4 text-brand-blue" />
                    Additional Information Requested
                  </span>
                )}
                {existingApplication.status === VerificationStatus.REJECTED && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Application Rejected
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-brand-muted">Submitted on</span>
              <p className="text-xs font-bold text-brand-navy">
                {new Date(existingApplication.submissionDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-brand-border">
              <span className="text-xs text-brand-muted">Registration Body</span>
              <p className="text-sm font-bold text-brand-navy mt-0.5">
                {existingApplication.registrationBody || 'IESL'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-brand-border">
              <span className="text-xs text-brand-muted">Registration / License Number</span>
              <p className="text-sm font-bold text-brand-navy mt-0.5">
                {existingApplication.registrationNumber}
              </p>
            </div>
          </div>

          {/* Reviewer Feedback (if any) */}
          {existingApplication.reviewerNotes && (
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
              <h4 className="text-xs font-bold text-brand-navy flex items-center gap-1.5 mb-1">
                <FileCheck className="w-4 h-4 text-brand-blue" />
                Auditor Assessment Notes
              </h4>
              <p className="text-xs text-brand-text leading-relaxed">
                {existingApplication.reviewerNotes}
              </p>
              {existingApplication.reviewedAt && (
                <p className="text-[11px] text-brand-muted mt-2">
                  Reviewed on: {new Date(existingApplication.reviewedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Documents Submitted */}
          <div>
            <h4 className="text-xs font-bold text-brand-navy mb-2">Uploaded Proof Documents</h4>
            <div className="space-y-2">
              {existingApplication.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-brand-border bg-white text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-brand-blue" />
                    <div>
                      <p className="font-semibold text-brand-navy">{doc.originalFilename}</p>
                      <span className="text-[11px] text-brand-muted">{doc.documentType}</span>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-brand-blue hover:underline"
                  >
                    View File
                  </a>
                </div>
              ))}
            </div>
          </div>

          {existingApplication.status === VerificationStatus.VERIFIED && (
            <div className="pt-2 flex justify-end">
              <Link href="/profile" className="btn-primary text-xs gap-1.5">
                Return to My Profile <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Case 2: Verification Form (if not submitted or needing resubmission) */}
      {(!existingApplication ||
        existingApplication.status === VerificationStatus.ADDITIONAL_INFO_REQUIRED ||
        existingApplication.status === VerificationStatus.REJECTED) && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <HardHat className="w-5 h-5 text-brand-orange" />
              Submit Professional Credentials
            </h2>
            <p className="text-xs text-brand-muted mt-0.5">
              Please provide your regulatory registration details and upload supporting documents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1">
                Engineering Regulatory Body
              </label>
              <select
                value={registrationBody}
                onChange={(e) => setRegistrationBody(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy bg-white"
              >
                <option value="IESL (Institution of Engineers, Sri Lanka)">
                  IESL (Institution of Engineers, Sri Lanka)
                </option>
                <option value="Society of Structural Engineers Sri Lanka (SSESL)">
                  Society of Structural Engineers Sri Lanka (SSESL)
                </option>
                <option value="Chartered Institution of Building Services Engineers (CIBSE)">
                  Chartered Institution of Building Services Engineers (CIBSE)
                </option>
                <option value="Institute of Quantity Surveyors Sri Lanka (IQSSL)">
                  Institute of Quantity Surveyors Sri Lanka (IQSSL)
                </option>
                <option value="Other International Recognized Body">
                  Other International Recognized Body
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy mb-1">
                Registration / Membership License Number
              </label>
              <input
                type="text"
                required
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. IESL-M-9021"
                className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
              />
            </div>
          </div>

          {/* Document Upload Area */}
          <div className="border border-brand-border rounded-xl p-5 bg-slate-50/70 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
                Upload Credential Documents
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">
                Accepted formats: PDF, PNG, JPG (Max 10MB per file). Include membership card, practicing license, or degree transcript.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-brand-navy mb-1">
                  Document Type
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border text-xs text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value={DocumentType.IESL_MEMBERSHIP_CARD}>IESL Membership Card</option>
                  <option value={DocumentType.DEGREE_CERTIFICATE}>Degree Certificate / Transcript</option>
                  <option value={DocumentType.PRACTICING_LICENSE}>Practicing License</option>
                  <option value={DocumentType.GOVERNMENT_ID}>NIC / Passport (Government ID)</option>
                  <option value={DocumentType.PROJECT_PORTFOLIO}>Project Portfolio</option>
                  <option value={DocumentType.OTHER}>Other Certificate</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-brand-navy mb-1">
                  Select File
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-brand-border border-dashed rounded-lg cursor-pointer hover:border-brand-blue transition-colors">
                  <UploadCloud className="w-4 h-4 text-brand-blue" />
                  <span className="text-xs font-medium text-brand-text">
                    {isUploading ? 'Uploading...' : 'Choose File to Attach'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    disabled={isUploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* List of Attached Documents */}
            {documents.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-brand-navy">
                  Ready to Submit ({documents.length}):
                </p>
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-brand-border text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-semibold text-brand-navy">{doc.originalFilename}</span>
                        <span className="ml-2 text-brand-muted">({doc.documentType})</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(idx)}
                      className="text-brand-muted hover:text-red-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-navy mb-1">
              Cover Note & Specialization Background (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Chartered member since 2018 with extensive residential and commercial structural inspection experience in Western Province."
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-sm text-brand-navy"
            />
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
            <div className="text-xs text-brand-text">
              <span className="font-bold text-brand-navy">Verification Guarantee:</span> All documents are encrypted and audited strictly for professional registration validation. Once verified, your profile displays the prestigious Verified Engineer badge across the directory and community Q&A.
            </div>
          </div>

          <div className="pt-4 border-t border-brand-border flex justify-end gap-3">
            <Link href="/profile" className="btn-secondary text-sm">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="btn-accent inline-flex items-center gap-2 text-sm font-bold"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? 'Submitting Application...' : 'Submit Credentials for Audit'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
        </div>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}
