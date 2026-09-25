'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSignal } from '@/context/SignalContext';
import { Send, Phone, Video, MoreVertical, Shield, Check, CheckCheck, Lock, Users } from 'lucide-react';
import GroupInfoModal from '@/components/modals/GroupInfoModal';

export default function ChatPane() {
  const { activeConversation, currentUser, messages, sendMessage } = useSignal();
  const [inputText, setInputText] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message whenever message state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Empty state when no conversation is selected
  if (!activeConversation) {
    return (
      <div className="flex-1 bg-[#F5F6F8] flex flex-col items-center justify-center p-8 select-none">
        <div className="w-20 h-20 bg-blue-50 text-[#305EE7] rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-blue-100">
          <Shield className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">Signal for Web</h3>
        <p className="text-xs text-gray-500 max-w-sm text-center">
          Select a chat from the sidebar or start a new conversation to begin end-to-end encrypted messaging.
        </p>
      </div>
    );
  }

  // Derive conversation header title
  const chatTitle = activeConversation.is_group
    ? activeConversation.title
    : activeConversation.other_user?.display_name || 'Direct Chat';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  // Status Indicator renderer for delivery/read checkmark receipts
  const renderReceipt = (status?: string) => {
    if (status === 'read') {
      return <CheckCheck className="w-3.5 h-3.5 text-emerald-400 inline-block ml-1 font-bold" />;
    } else if (status === 'delivered') {
      return <CheckCheck className="w-3.5 h-3.5 text-emerald-200 inline-block ml-1" />;
    }
    return <Check className="w-3.5 h-3.5 text-emerald-200 inline-block ml-1" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#EFEAE2] relative overflow-hidden select-none">
      {/* Active Chat Header */}
      <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between shadow-xs z-10">
        {/* Clickable area for Group Info Modal */}
        <div
          onClick={() => {
            if (activeConversation.is_group) {
              setIsGroupModalOpen(true);
            }
          }}
          className={`flex items-center gap-3 p-1 rounded-lg transition ${
            activeConversation.is_group ? 'cursor-pointer hover:bg-gray-50' : ''
          }`}
          title={activeConversation.is_group ? 'Click to view group details & members' : ''}
        >
          <div className="w-10 h-10 rounded-full bg-[#305EE7] text-white font-bold flex items-center justify-center text-md shrink-0">
            {activeConversation.is_group ? (
              <Users className="w-5 h-5 text-white" />
            ) : chatTitle ? (
              chatTitle[0].toUpperCase()
            ) : (
              'C'
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
              {chatTitle}
              {activeConversation.is_group && (
                <span className="text-[10px] bg-blue-50 text-[#305EE7] font-bold px-1.5 py-0.5 rounded-full">
                  Group
                </span>
              )}
            </h3>
            <p className="text-[11px] text-green-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-gray-600">
          {activeConversation.is_group && (
            <button
              onClick={() => setIsGroupModalOpen(true)}
              title="Group Members & Admin Settings"
              className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer text-[#305EE7]"
            >
              <Users className="w-4 h-4" />
            </button>
          )}

          <button
            title="Voice Call (Coming Soon)"
            className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            title="Video Call (Coming Soon)"
            className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <Video className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-gray-200 mx-1" />

          <button
            title="More Options"
            className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F6F8]">
        {/* Signal Safety Banner */}
        <div className="flex justify-center mb-4">
          <div className="bg-white/80 backdrop-blur-xs border border-gray-200 rounded-xl px-4 py-2 text-[11px] text-gray-500 flex items-center gap-1.5 shadow-xs">
            <Lock className="w-3 h-3 text-[#305EE7]" />
            Messages and calls are end-to-end encrypted. No one outside of this chat can read them.
          </div>
        </div>

        {/* Safe mapping over message array */}
        {Array.isArray(messages) &&
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm shadow-xs ${
                    isMe
                      ? 'bg-[#305EE7] text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  {/* Sender Name display for Group Conversations */}
                  {!isMe && activeConversation.is_group && (
                    <span className="block text-[10px] font-bold text-[#305EE7] mb-0.5">
                      {msg.sender?.display_name || 'Member'}
                    </span>
                  )}

                  <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                    {msg.content}
                  </p>

                  <div
                    className={`text-[10px] mt-1 flex items-center justify-end gap-0.5 ${
                      isMe ? 'text-emerald-200 font-medium' : 'text-gray-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && renderReceipt(msg.status)}
                  </div>
                </div>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Form */}
      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            placeholder="Signal message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-gray-100 border border-gray-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#305EE7] text-gray-800"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-9 h-9 bg-[#305EE7] hover:bg-[#3A76F0] disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition cursor-pointer shadow-sm shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

      {/* Group Info / Member Management Modal */}
      <GroupInfoModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </div>
  );
}