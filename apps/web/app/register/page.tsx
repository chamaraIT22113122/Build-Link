'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Logo } from '../../components/Logo';
import {
  User,
  HardHat,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { UserRole, CONSTRUCTION_CATEGORIES } from '@buildlink/shared';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [engineerTitle, setEngineerTitle] = useState('');
  const [specialization, setSpecialization] = useState<string>(CONSTRUCTION_CATEGORIES[0]);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!agreeTerms) {
      setErrorMessage('You must agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (!firstName || !lastName || !email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';
      const payload = {
        role,
        firstName,
        lastName,
        email,
        password,
        ...(role === UserRole.ENGINEER && {
          engineerTitle: engineerTitle || 'Professional Engineer',
          specialization,
        }),
      };

      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(
          data?.error?.message || 'Registration failed. Please check your details and try again.'
        );
      } else {
        login(data.data.token, data.data.user);
        router.push('/profile');
      }
    } catch {
      setErrorMessage(
        'Unable to contact BuildLink API server. Please ensure the backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-brand-border shadow-sm">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo variant="icon" />
          </div>
          <h2 className="text-2xl font-extrabold text-brand-navy">
            Create Your BuildLink Account
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            Join the community dedicated to better, safer construction.
          </p>
        </div>

        {/* Role Selector Card */}
        <div>
          <label className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-2">
            Select Your Account Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole(UserRole.USER)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                role === UserRole.USER
                  ? 'border-brand-blue bg-blue-50/60 ring-2 ring-brand-blue/30'
                  : 'border-brand-border hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <User
                  className={`w-5 h-5 ${
                    role === UserRole.USER ? 'text-brand-blue' : 'text-slate-400'
                  }`}
                />
                <span className="font-bold text-sm text-brand-navy">Homeowner</span>
              </div>
              <p className="text-xs text-brand-muted">
                Ask questions, share projects & book consultations
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole(UserRole.ENGINEER)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                role === UserRole.ENGINEER
                  ? 'border-brand-orange bg-amber-50/60 ring-2 ring-brand-orange/30'
                  : 'border-brand-border hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <HardHat
                  className={`w-5 h-5 ${
                    role === UserRole.ENGINEER ? 'text-brand-orange' : 'text-slate-400'
                  }`}
                />
                <span className="font-bold text-sm text-brand-navy">Engineer</span>
              </div>
              <p className="text-xs text-brand-muted">
                Verify credentials, answer Q&A & offer consultations
              </p>
            </button>
          </div>
        </div>

        {role === UserRole.ENGINEER && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-brand-blue">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-brand-blue mt-0.5" />
            <span>
              Engineer accounts submit degrees & registration certificates for administrative verification after registration.
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="first-name"
                className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1"
              >
                First Name
              </label>
              <input
                id="first-name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Kamal"
                className="w-full px-3 py-2.5 bg-slate-50 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="last-name"
                className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1"
              >
                Last Name
              </label>
              <input
                id="last-name"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Perera"
                className="w-full px-3 py-2.5 bg-slate-50 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamal@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1"
            >
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
              />
            </div>
          </div>

          {/* Conditional Engineer Fields */}
          {role === UserRole.ENGINEER && (
            <div className="pt-2 border-t border-brand-border space-y-4">
              <div>
                <label
                  htmlFor="eng-title"
                  className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1"
                >
                  Professional Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    id="eng-title"
                    type="text"
                    required
                    value={engineerTitle}
                    onChange={(e) => setEngineerTitle(e.target.value)}
                    placeholder="e.g. Chartered Structural Engineer"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="specialization"
                  className="block text-xs font-semibold text-brand-navy uppercase tracking-wider mb-1"
                >
                  Primary Specialization
                </label>
                <select
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white"
                >
                  {CONSTRUCTION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex items-start pt-2">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4 text-brand-orange focus:ring-brand-orange border-slate-300 rounded mt-0.5 cursor-pointer"
            />
            <label
              htmlFor="agree-terms"
              className="ml-2 block text-xs text-brand-muted cursor-pointer leading-relaxed"
            >
              I agree to BuildLink&apos;s{' '}
              <Link href="/terms" className="text-brand-blue hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-brand-blue hover:underline">
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 text-sm font-semibold gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-brand-border text-center">
          <p className="text-xs text-brand-muted">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-brand-blue hover:text-blue-700 inline-flex items-center gap-1"
            >
              Sign In
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
