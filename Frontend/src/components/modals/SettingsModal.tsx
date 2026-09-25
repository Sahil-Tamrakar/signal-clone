'use client';

import React, { useState } from 'react';
import { X, PhoneCall, Video, Laptop, Sparkles, Bell, Shield, Moon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showPlaceholder = (featureName: string) => {
    setToast(`${featureName} feature coming soon!`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-900">Signal Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="mb-4 p-2.5 bg-blue-50 text-[#305EE7] rounded-lg text-xs font-semibold text-center border border-blue-200">
            {toast}
          </div>
        )}

        {/* Feature List */}
        <div className="space-y-2">
          <button
            onClick={() => showPlaceholder('Voice & Video Calling')}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition text-left"
          >
            <PhoneCall className="w-5 h-5 text-[#305EE7]" />
            <div>
              <p className="font-medium text-sm text-gray-800">Voice & Video Calls</p>
              <p className="text-xs text-gray-400">Encrypted 1-on-1 and group calls</p>
            </div>
          </button>

          <button
            onClick={() => showPlaceholder('Signal Stories')}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition text-left"
          >
            <Sparkles className="w-5 h-5 text-purple-500" />
            <div>
              <p className="font-medium text-sm text-gray-800">Signal Stories</p>
              <p className="text-xs text-gray-400">Share ephemeral updates with contacts</p>
            </div>
          </button>

          <button
            onClick={() => showPlaceholder('Linked Devices')}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition text-left"
          >
            <Laptop className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="font-medium text-sm text-gray-800">Linked Devices</p>
              <p className="text-xs text-gray-400">Sync with Signal Desktop or iPad</p>
            </div>
          </button>

          <button
            onClick={() => showPlaceholder('Privacy & Safety')}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition text-left border-t"
          >
            <Shield className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium text-sm text-gray-800">Privacy & Security</p>
              <p className="text-xs text-gray-400">Screen lock, registration lock, PINs</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}