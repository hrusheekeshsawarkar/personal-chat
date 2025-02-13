'use client';

import { useState } from 'react';

interface ChatHistory {
  id: string;
  title: string;
  timestamp: string;
  type: string;
}

export default function Settings() {
  const [chatHistory] = useState<ChatHistory[]>([
    {
      id: '1',
      title: 'Casual greeting and inquiry',
      timestamp: 'Today',
      type: 'Default Topic'
    },
    // Add more chat history items
  ]);

  return (
    <div className="w-80 bg-[#1a1a1a] border-l border-[#2a2a2a]">
      {/* Topic Header */}
      <div className="p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-medium">Topic</h2>
          <button className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div className="mt-2 flex items-center space-x-2">
          <span className="px-3 py-1 bg-[#2a2a2a] text-white rounded-full text-sm">Default Topic</span>
          <span className="text-gray-400 text-sm">Temporary</span>
        </div>
      </div>

      {/* Chat History */}
      <div className="p-4">
        <h3 className="text-gray-400 text-sm mb-3">Today</h3>
        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            className="p-3 rounded-lg hover:bg-[#2a2a2a] cursor-pointer mb-2"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white text-sm">{chat.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 