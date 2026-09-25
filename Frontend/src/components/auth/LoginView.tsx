'use client';

import React, { useState } from 'react';
import { useSignal } from '@/context/SignalContext';
import { Shield, ArrowRight, UserPlus, CheckCircle2 } from 'lucide-react';

export default function LoginView() {
  const { setCurrentUser } = useSignal();
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Phone submit
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setStep('otp');
  };

  // Step 2: OTP Verify (Detects if account exists)
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber.trim(),
          otp: otp.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Verification failed. Use OTP: 123456');
      }

      const data = await res.json();

      if (data.exists) {
        // Account exists -> Log in directly
        localStorage.setItem('signal_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
      } else {
        // New phone number -> Show Profile Creation Form
        setStep('profile');
      }
    } catch (err: any) {
      setError(err.message || 'Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Register New User Profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim()) {
      setError('Please fill in all profile fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber.trim(),
          display_name: displayName.trim(),
          username: username.toLowerCase().trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create profile');
      }

      const newUser = await res.json();
      localStorage.setItem('signal_user', JSON.stringify(newUser));
      setCurrentUser(newUser);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F5F6F8] p-4 select-none">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100 flex flex-col items-center">
        {/* Signal Branding Logo */}
        <div className="w-16 h-16 rounded-2xl bg-[#305EE7] flex items-center justify-center text-white mb-4 shadow-lg shadow-[#305EE7]/30">
          <Shield className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Signal Messenger</h2>
        <p className="text-xs text-gray-500 mb-6 text-center">
          {step === 'phone' && 'Enter your phone number to get started'}
          {step === 'otp' && `Enter 6-digit code sent to ${phoneNumber}`}
          {step === 'profile' && 'New number detected! Set up your Signal profile'}
        </p>

        {error && (
          <div className="w-full mb-4 p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium text-center border border-red-200">
            {error}
          </div>
        )}

        {/* STEP 1: PHONE NUMBER */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#305EE7] text-gray-800"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#305EE7] hover:bg-[#3A76F0] text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <form onSubmit={handleOtpVerify} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#305EE7] text-gray-800"
              />
              <span className="text-[11px] text-gray-500 mt-1.5 block text-center">
                Use fixed testing OTP: <strong className="text-[#305EE7]">123456</strong>
              </span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#305EE7] hover:bg-[#3A76F0] disabled:bg-gray-300 text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="w-full text-xs text-gray-500 hover:underline text-center block cursor-pointer"
            >
              Change Phone Number
            </button>
          </form>
        )}

        {/* STEP 3: NEW USER PROFILE CREATION */}
        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="w-full space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sahil Tamrakar"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#305EE7] text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="e.g. sahil"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#305EE7] text-gray-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#305EE7] hover:bg-[#3A76F0] text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-md mt-2 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Complete Profile'} <UserPlus className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-6 flex items-center gap-1.5 text-xs text-gray-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Signal End-to-End Encrypted
        </div>
      </div>
    </div>
  );
}