'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Conversation, Message } from '../types';

interface SignalContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  activeConversation: Conversation | null;
  setActiveConversation: (conv: Conversation | null) => void;
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sendMessage: (content: string) => void;
  logout: () => void;
}

const SignalContext = createContext<SignalContextType | undefined>(undefined);

export const SignalProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Restore session on initial load
  useEffect(() => {
    const saved = localStorage.getItem('signal_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('signal_user');
      }
    }
  }, []);

  // Fetch messages and trigger read receipts whenever active conversation changes
  useEffect(() => {
    if (!activeConversation || !currentUser) return;

    // 1. Fetch current chat messages safely
    fetch(`http://127.0.0.1:8000/messages/${activeConversation.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          console.error('Expected array from messages API, got:', data);
          setMessages([]);
        }
      })
      .catch((err) => {
        console.error('Error loading messages:', err);
        setMessages([]);
      });

    // 2. Mark incoming messages as 'read'
    fetch(`http://127.0.0.1:8000/messages/read/${activeConversation.id}?user_id=${currentUser.id}`, {
      method: 'PUT',
    })
      .then((res) => res.json())
      .catch((err) => console.error('Failed to mark messages as read:', err));
  }, [activeConversation, currentUser]);

  // Real-time WebSocket lifecycle
  useEffect(() => {
    if (!currentUser) return;

    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${currentUser.id}`);

    socket.onopen = () => {
      console.log('WebSocket connected for user:', currentUser.id);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle incoming new messages
      if (data.type === 'new_message' || data.type === 'send_message') {
        const incomingMsg = data.message;

        // Functional state update prevents missing activeConversation in closure
        setActiveConversation((currentActive) => {
          if (currentActive && incomingMsg.conversation_id === currentActive.id) {
            setMessages((prev) => {
              if (Array.isArray(prev) && prev.some((m) => m.id === incomingMsg.id)) return prev;
              return Array.isArray(prev) ? [...prev, incomingMsg] : [incomingMsg];
            });
          }
          return currentActive;
        });
      } 
      // Handle read receipt updates
      else if (data.type === 'messages_read') {
        setActiveConversation((currentActive) => {
          if (currentActive && data.conversation_id === currentActive.id) {
            setMessages((prev) =>
              Array.isArray(prev)
                ? prev.map((msg) =>
                    msg.conversation_id === data.conversation_id ? { ...msg, status: 'read' } : msg
                  )
                : []
            );
          }
          return currentActive;
        });
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket Error:', err);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [currentUser]);

  // Send message function
  const sendMessage = async (content: string) => {
    if (!activeConversation || !currentUser || !content.trim()) return;

    try {
      // 1. Persist message to backend database
      const res = await fetch(`http://127.0.0.1:8000/messages/?sender_id=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConversation.id,
          content: content,
        }),
      });

      const newMsg = await res.json();

      // 2. Append to local UI state immediately
      setMessages((prev) => {
        if (Array.isArray(prev) && prev.some((m) => m.id === newMsg.id)) return prev;
        return Array.isArray(prev) ? [...prev, newMsg] : [newMsg];
      });

      // 3. Broadcast real-time message payload via WebSockets
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'send_message', message: newMsg }));
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('signal_user');
    setCurrentUser(null);
    setActiveConversation(null);
    setConversations([]);
    setMessages([]);
  };

  return (
    <SignalContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeConversation,
        setActiveConversation,
        conversations,
        setConversations,
        messages,
        setMessages,
        sendMessage,
        logout,
      }}
    >
      {children}
    </SignalContext.Provider>
  );
};

export const useSignal = () => {
  const context = useContext(SignalContext);
  if (!context) throw new Error('useSignal must be used within SignalProvider');
  return context;
};