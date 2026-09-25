'use client';

import { SignalProvider, useSignal } from '@/context/SignalContext';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatPane from '@/components/chat/ChatPane';
import LoginView from '@/components/auth/LoginView';

function AppContent() {
  const { currentUser } = useSignal();

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white font-sans antialiased">
      <Sidebar />
      <ChatPane />
    </main>
  );
}

export default function Home() {
  return (
    <SignalProvider>
      <AppContent />
    </SignalProvider>
  );
}