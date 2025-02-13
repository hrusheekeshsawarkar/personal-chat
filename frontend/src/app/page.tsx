'use client';

import { useState } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatMain from '../components/ChatMain';
import Settings from '../components/Settings';

interface Agent {
  id: string;
  name: string;
}

export default function Home() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  return (
    <div className="flex h-screen bg-[#1a1a1a]">
      <ChatSidebar 
        activeChatId={activeChatId} 
        onChatSelect={setActiveChatId}
        onAgentSelect={setSelectedAgent}
      />
      <ChatMain 
        chatId={activeChatId} 
        selectedAgent={selectedAgent || undefined}
      />
      <Settings />
    </div>
  );
}
