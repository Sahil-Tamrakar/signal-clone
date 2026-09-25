// In frontend/src/types/index.ts

export interface User {
  id: number;
  phone_number: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  status_text?: string;
  is_online: boolean;
  last_seen: string;
}

export interface Conversation {
  id: number;
  is_group: boolean;
  title?: string;
  avatar_url?: string;
  updated_at: string;
  other_user?: User; // <--- Added field
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reply_to_id?: number;
  created_at: string;
  sender: User;
}