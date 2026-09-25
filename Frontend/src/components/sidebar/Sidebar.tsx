'use client';

import React, { useState, useEffect } from 'react';
import { useSignal } from '@/context/SignalContext';
import { Search, Edit, MoreVertical, ShieldCheck, LogOut } from 'lucide-react';
import NewChatModal from '../modals/NewChatModal';
import SettingsModal from '../modals/SettingsModal';

export default function Sidebar() {
  const {
    currentUser,
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    logout,
  } = useSignal();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    fetch(`http://127.0.0.1:8000/conversations/user/${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => setConversations(data))
      .catch((err) => console.error('Error fetching conversations:', err));
  }, [currentUser, setConversations]);

  // Filter conversations based on search input
  const filteredConversations = conversations.filter((conv: any) => {
    const title = conv.is_group
      ? conv.title
      : conv.other_user?.display_name || 'Direct Chat';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <aside className="w-80 border-r border-gray-200 bg-white flex flex-col h-full select-none shrink-0">
        {/* Signal Header */}
        <div className="p-3 bg-[#305EE7] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            {/* Logged-In User Avatar */}
            <div className="w-9 h-9 rounded-full bg-white text-[#305EE7] font-bold flex items-center justify-center shadow-xs">
              {currentUser?.display_name ? currentUser.display_name[0].toUpperCase() : 'S'}
            </div>

            {/* Logged-In User Information */}
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm truncate max-w-[110px]">
                {currentUser?.display_name || 'Signal User'}
              </span>
              <span className="text-[11px] text-blue-100 font-mono">
                ID: #{currentUser?.id ?? 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* New Chat / Group Action */}
            <button
              onClick={() => setIsNewChatOpen(true)}
              title="New Chat / Group"
              className="p-1.5 hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <Edit className="w-4 h-4" />
            </button>

            {/* Settings Modal Toggle */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
              className="p-1.5 hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Log Out */}
            <button
              onClick={logout}
              title="Log Out"
              className="p-1.5 hover:bg-white/10 rounded-full transition text-red-200 hover:text-white cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 text-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts or chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-gray-700 text-xs"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conv: any) => {
              const isActive = activeConversation?.id === conv.id;
              const chatTitle = conv.is_group
                ? conv.title
                : conv.other_user?.display_name || 'Direct Chat';
              const avatarLetter = chatTitle ? chatTitle[0].toUpperCase() : 'C';

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition ${
                    isActive ? 'bg-[#305EE7]/10 border-l-4 border-[#305EE7]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-[#305EE7] text-white font-semibold flex items-center justify-center text-md shadow-xs">
                    {avatarLetter}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-medium text-gray-900 truncate text-sm">
                        {chatTitle}
                      </h4>
                      <span className="text-[11px] text-gray-400">12:30 PM</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      Tap to open conversation
                    </p>
                  </div>

                  {/* Unread Message Count Badge */}
                  {conv.unread_count > 0 && (
                    <div className="w-5 h-5 bg-[#305EE7] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs shrink-0">
                      {conv.unread_count}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Security Footer Badge */}
        <div className="p-2 text-center text-xs text-gray-400 bg-gray-50 border-t flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#305EE7]" /> Signal End-to-End Encrypted
        </div>
      </aside>

      {/* Render Modals */}
      <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}