'use client';

import React, { useState, useEffect } from 'react';
import { useSignal } from '@/context/SignalContext';
import { User } from '@/types';
import { X, Users, UserPlus } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewChatModal({ isOpen, onClose }: Props) {
  const { currentUser, setConversations, setActiveConversation } = useSignal();
  const [contacts, setContacts] = useState<User[]>([]);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Fixed single quotes to template literal backticks
    fetch(`${API_BASE}/contacts`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setContacts(data.filter((u: User) => u.id !== currentUser?.id));
        } else {
          setContacts([]);
        }
      })
      .catch((err) => console.error('Failed to load contacts:', err));
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleStartDirectChat = async (targetUserId: number) => {
    if (!currentUser) return;
    try {
      // Fixed single quotes to template literal backticks
      const res = await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          target_user_id: targetUserId,
        }),
      });
      const conv = await res.json();
      setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
      setActiveConversation(conv);
      onClose();
    } catch (err) {
      console.error('Error starting direct chat:', err);
    }
  };

  const handleCreateGroup = async () => {
    if (!currentUser || !groupTitle.trim() || selectedMemberIds.length === 0) return;
    try {
      // Fixed single quotes to template literal backticks
      const res = await fetch(`${API_BASE}/contacts/conversations/group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: currentUser.id,
          title: groupTitle,
          member_ids: selectedMemberIds,
        }),
      });
      const conv = await res.json();
      setConversations((prev) => [conv, ...prev]);
      setActiveConversation(conv);
      onClose();
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-[#305EE7] text-white flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {isGroupMode ? <Users className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isGroupMode ? 'New Group' : 'New Chat'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="p-3 bg-gray-50 border-b flex gap-2">
          <button
            onClick={() => setIsGroupMode(false)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
              !isGroupMode ? 'bg-white shadow-xs text-[#305EE7]' : 'text-gray-500'
            }`}
          >
            Direct Message
          </button>
          <button
            onClick={() => setIsGroupMode(true)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition ${
              isGroupMode ? 'bg-white shadow-xs text-[#305EE7]' : 'text-gray-500'
            }`}
          >
            New Group
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 max-h-80 overflow-y-auto space-y-3">
          {isGroupMode && (
            <input
              type="text"
              placeholder="Group Name..."
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#305EE7]"
            />
          )}

          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase">Select Contacts</span>
            {contacts.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No other contacts found.</p>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => {
                    if (isGroupMode) {
                      setSelectedMemberIds((prev) =>
                        prev.includes(contact.id)
                          ? prev.filter((id) => id !== contact.id)
                          : [...prev, contact.id]
                      );
                    } else {
                      handleStartDirectChat(contact.id);
                    }
                  }}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                    selectedMemberIds.includes(contact.id) ? 'bg-[#305EE7]/10' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#305EE7] text-white font-semibold flex items-center justify-center">
                    {contact.display_name ? contact.display_name[0] : 'U'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-800">{contact.display_name}</h4>
                    <p className="text-xs text-gray-400">@{contact.username}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        {isGroupMode && (
          <div className="p-3 bg-gray-50 border-t flex justify-end">
            <button
              onClick={handleCreateGroup}
              className="px-4 py-2 bg-[#305EE7] text-white rounded-lg text-sm font-medium hover:bg-[#3A76F0] transition"
            >
              Create Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}