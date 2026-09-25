'use client';

import React, { useState, useEffect } from 'react';
import { useSignal } from '@/context/SignalContext';
import { X, UserPlus, UserMinus, ShieldCheck } from 'lucide-react';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function GroupInfoModal({ isOpen, onClose }: GroupInfoModalProps) {
  const { activeConversation, currentUser } = useSignal();
  const [members, setMembers] = useState<any[]>([]);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !activeConversation) return;

    // Fetch members of current group
    fetch(`${API_BASE}/conversations/${activeConversation.id}/members`)
      .then((res) => res.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching group members:", err));

    // Fetch all contacts to populate "Add Member" dropdown
    fetch(`${API_BASE}/contacts/`)
      .then((res) => res.json())
      .then((data) => setAllContacts(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching contacts:", err));
  }, [isOpen, activeConversation]);

  if (!isOpen || !activeConversation) return null;

  const isAdmin = members.some(
    (m) => m.user_id === currentUser?.id && m.is_admin
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    await fetch(
      `${API_BASE}/conversations/${activeConversation.id}/members?user_id=${selectedUserId}&requester_id=${currentUser?.id}`,
      { method: 'POST' }
    );

    // Refresh member list
    const updated = await fetch(
      `${API_BASE}/conversations/${activeConversation.id}/members`
    ).then((res) => res.json());
    setMembers(Array.isArray(updated) ? updated : []);
    setSelectedUserId('');
  };

  // FIX: Changed type annotation from 'int' to 'number' and updated fetch URL
  const handleRemoveMember = async (targetUserId: number) => {
    await fetch(
      `${API_BASE}/conversations/${activeConversation.id}/members/${targetUserId}?requester_id=${currentUser?.id}`,
      { method: 'DELETE' }
    );

    // Refresh member list
    setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
  };

  // Filter out contacts already in the group
  const availableContacts = allContacts.filter(
    (c) => !members.some((m) => m.user_id === c.id)
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {activeConversation.title} Members
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Add Member Section (Admin Only) */}
        {isAdmin && availableContacts.length > 0 && (
          <div className="mb-4 flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
            >
              <option value="">Select contact to add...</option>
              {availableContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name} (@{c.username})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddMember}
              disabled={!selectedUserId}
              className="bg-[#305EE7] text-white text-xs px-3 py-2 rounded-lg font-medium flex items-center gap-1 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" /> Add
            </button>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-gray-100">
          {members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between pt-2 pb-1"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#305EE7] text-white font-bold flex items-center justify-center text-xs">
                  {m.display_name ? m.display_name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                    {m.display_name}
                    {m.is_admin && (
                      <span className="text-[10px] bg-blue-50 text-[#305EE7] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-400">@{m.username}</p>
                </div>
              </div>

              {/* Admin Kick Action */}
              {isAdmin && m.user_id !== currentUser?.id && (
                <button
                  onClick={() => handleRemoveMember(m.user_id)}
                  title="Remove Member"
                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition cursor-pointer"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}