'use client';

import { useState } from 'react';
import ChatSidebar from '@/components/ChatSidebar';
import ChatMain from '@/components/ChatMain';
import Settings from '@/components/Settings';

export default function Home() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  return (
    <div className="flex h-screen bg-[#1a1a1a]">
      <ChatSidebar 
        activeChatId={activeChatId} 
        onChatSelect={setActiveChatId} 
      />
      <ChatMain chatId={activeChatId} />
      <Settings />
    </div>
  );
}
