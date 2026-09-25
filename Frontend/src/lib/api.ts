const API_BASE = 'http://127.0.0.1:8000';

export async function fetchConversations(userId: number) {
  const res = await fetch(`${API_BASE}/conversations/user/${userId}`);
  return res.json();
}

export async function fetchMessages(conversationId: number) {
  const res = await fetch(`${API_BASE}/messages/${conversationId}`);
  return res.json();
}

export async function fetchContacts() {
  const res = await fetch(`${API_BASE}/contacts/`);
  return res.json();
}

export async function verifyOTP(phoneNumber: string, otp: string) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phoneNumber, otp }),
  });
  if (!res.ok) throw new Error('Invalid OTP');
  return res.json();
}