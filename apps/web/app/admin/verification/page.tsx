'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  UserRole,
  VerificationStatus,
  VerificationApplicationDto,
  AuditLogDto,
} from '@buildlink/shared';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  Eye,
  History,
  Info,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

function AdminVerificationContent() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'applications' | 'audit'>('applications');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [applications, setApplications] = useState<VerificationApplicationDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Review Modal State
  const [selectedApp, setSelectedApp] = useState<VerificationApplicationDto | null>(null);
  const [reviewStatus, setReviewStatus] = useState<VerificationStatus>(VerificationStatus.VERIFIED);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  const loadData = async () => {
    if (!token) return;
    setLoadingData(true);
    setFeedback(null);

    try {
      // 1. Fetch applications
      const filterQuery = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const appRes = await fetch(`${apiUrl}/verification/admin/applications${filterQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const appData = await appRes.json();
      if (appData.success) {
        setApplications(appData.data || []);
      }

      // 2. Fetch audit logs
      const auditRes = await fetch(`${apiUrl}/verification/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const auditData = await auditRes.json();
      if (auditData.success) {
        setAuditLogs(auditData.data || []);
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Failed to retrieve administrative verification data.',
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/admin/verification');
      return;
    }

    if (user && user.role !== UserRole.ADMIN) {
      // Not admin - redirect to profile
      router.push('/profile');
      return;
    }

    if (token) {
      loadData();
    }
  }, [user, token, authLoading, router, statusFilter]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (!reviewerNotes.trim()) {
      setFeedback({
        type: 'error',
        text: 'Reviewer audit notes are required for compliance tracking.',
      });
      return;
    }

    setIsSubmittingReview(true);
    setFeedback(null);

    try {
      const res = await fetch(`${apiUrl}/verification/admin/applications/${selectedApp.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: reviewStatus,
          reviewerNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to submit review.');
      }

      setFeedback({
        type: 'success',
        text: `Application for ${selectedApp.engineerName || 'Engineer'} updated to ${reviewStatus}.`,
      });
      setSelectedApp(null);
      setReviewerNotes('');
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error reviewing application.',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (authLoading || (loadingData && applications.length === 0 && auditLogs.length === 0)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-navy via-[#173866] to-brand-blue rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Credential Verification & Audit Console
              </h1>
              <span className="bg-red-500/20 text-red-200 border border-red-400/40 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Admin
              </span>
            </div>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Review professional engineer submissions, audit credential certificates against regulatory rosters, and view immutable audit trails.
            </p>
          </div>
          <Link href="/profile" className="btn-secondary text-xs">
            Return to Profile
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{feedback.text}</span>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex border-b border-brand-border mb-6 gap-2">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'applications'
              ? 'border-brand-blue text-brand-blue bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-brand-muted hover:text-brand-navy'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Applications ({applications.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-brand-blue text-brand-blue bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-brand-muted hover:text-brand-navy'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Trail Log ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Applications */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-brand-muted mr-1">Filter by Status:</span>
            {['ALL', 'PENDING_REVIEW', 'VERIFIED', 'ADDITIONAL_INFO_REQUIRED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'bg-white text-brand-text border border-brand-border hover:bg-slate-50'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-border p-12 text-center text-brand-muted">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-brand-navy">No applications found</p>
              <p className="text-xs mt-1">There are no verification applications matching status &apos;{statusFilter}&apos;.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-brand-border text-brand-muted font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Applicant Engineer</th>
                      <th className="py-3.5 px-4">Registration Body / License</th>
                      <th className="py-3.5 px-4">Submission Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border text-brand-text">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4 font-semibold text-brand-navy">
                          <p>{app.engineerName || 'Professional Engineer'}</p>
                          <span className="text-[11px] font-normal text-brand-muted">{app.engineerEmail}</span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-brand-navy">{app.registrationBody || 'IESL'}</p>
                          <span className="text-[11px] font-mono text-brand-muted">{app.registrationNumber}</span>
                        </td>
                        <td className="py-4 px-4 text-brand-muted">
                          {new Date(app.submissionDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          {app.status === VerificationStatus.VERIFIED && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                            </span>
                          )}
                          {app.status === VerificationStatus.PENDING_REVIEW && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                            </span>
                          )}
                          {app.status === VerificationStatus.ADDITIONAL_INFO_REQUIRED && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                              <Info className="w-3 h-3 text-blue-600" /> Info Required
                            </span>
                          )}
                          {app.status === VerificationStatus.REJECTED && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 text-red-600" /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setReviewStatus(
                                app.status === VerificationStatus.PENDING_REVIEW
                                  ? VerificationStatus.VERIFIED
                                  : app.status
                              );
                              setReviewerNotes(app.reviewerNotes || '');
                            }}
                            className="btn-secondary text-xs py-1 px-3 inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect & Audit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Audit Logs History */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-brand-border">
            <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider">
              Immutable System Audit Log
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Tracks all credential submissions, reviewer status updates, and compliance records.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/50 border-b border-brand-border text-brand-muted font-bold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-brand-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-brand-navy">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-brand-muted">
                      {log.actorEmail || 'System'}
                    </td>
                    <td className="py-3 px-4 text-brand-text max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-brand-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Audit Verification Application</h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  Applicant: <span className="font-semibold text-brand-navy">{selectedApp.engineerName}</span> ({selectedApp.engineerEmail})
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-brand-muted hover:text-brand-navy font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-brand-border">
                <span className="text-brand-muted">Regulatory Body</span>
                <p className="font-bold text-brand-navy mt-0.5">{selectedApp.registrationBody}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-brand-border">
                <span className="text-brand-muted">License / Reg Number</span>
                <p className="font-bold text-brand-navy mt-0.5">{selectedApp.registrationNumber}</p>
              </div>
            </div>

            {/* Attached Documents */}
            <div>
              <h4 className="text-xs font-bold text-brand-navy mb-2">Attached Credentials ({selectedApp.documents.length})</h4>
              <div className="space-y-2">
                {selectedApp.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-brand-border bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-2">
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
                      className="px-3 py-1 rounded bg-white border border-brand-border text-brand-blue hover:bg-blue-50 font-semibold text-[11px]"
                    >
                      Inspect File
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Review Form */}
            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2 border-t border-brand-border">
              <div>
                <label className="block text-xs font-semibold text-brand-navy mb-1">
                  Determination Decision
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus(VerificationStatus.VERIFIED)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      reviewStatus === VerificationStatus.VERIFIED
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-brand-text hover:bg-slate-200'
                    }`}
                  >
                    Approve (Verified)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus(VerificationStatus.ADDITIONAL_INFO_REQUIRED)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      reviewStatus === VerificationStatus.ADDITIONAL_INFO_REQUIRED
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-brand-text hover:bg-slate-200'
                    }`}
                  >
                    Request Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus(VerificationStatus.REJECTED)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      reviewStatus === VerificationStatus.REJECTED
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-100 text-brand-text hover:bg-slate-200'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-navy mb-1">
                  Auditor Assessment Notes (Visible to applicant and recorded in audit log)
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="e.g. Verified against IESL chartered roster 2026. Credentials verified and in good standing."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border focus:ring-2 focus:ring-brand-blue focus:outline-none text-xs text-brand-navy"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="btn-primary text-xs font-bold"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Record Audit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
        </div>
      }
    >
      <AdminVerificationContent />
    </Suspense>
  );
}
