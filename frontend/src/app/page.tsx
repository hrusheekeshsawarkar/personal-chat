'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ChatSidebar from '../components/ChatSidebar';
import ChatMain from '../components/ChatMain';
import Settings from '../components/Settings';

interface Agent {
  id: string;
  name: string;
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }
  
  return (
    <div className="flex h-screen bg-[#1a1a1a]">
      <ChatSidebar 
        activeChatId={activeChatId} 
        onChatSelect={setActiveChatId}
        onAgentSelect={setSelectedAgent}
        user={user}
      />
      <ChatMain 
        chatId={activeChatId} 
        selectedAgent={selectedAgent || undefined}
        user={user}
      />
      <Settings />
    </div>
  );
}
