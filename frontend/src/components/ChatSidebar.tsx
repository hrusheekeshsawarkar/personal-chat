'use client';

import { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  avatar: string;
  description: string;
}

interface ChatSidebarProps {
  activeChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onAgentSelect: (agent: { id: string; name: string }) => void;
}

export default function ChatSidebar({ activeChatId, onChatSelect, onAgentSelect }: ChatSidebarProps) {
  const [agents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Just Chat',
      avatar: '/agents/just-chat.png',
      description: 'Activate the brain cluster and spark creative thinking.'
    },
    {
      id: '2',
      name: 'Lima',
      avatar: '/agents/lima.png',
      description: 'Your friendly AI companion'
    },
    // Add more agents as needed
  ]);

  return (
    <div className="w-72 bg-[#1a1a1a] flex flex-col">
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search assistants..."
            className="w-full bg-[#2a2a2a] text-white rounded-lg px-4 py-2 pl-10 focus:outline-none"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Agents List */}
      <div className="flex-1 overflow-y-auto">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="p-4 hover:bg-[#2a2a2a] cursor-pointer"
            onClick={() => onAgentSelect({ id: agent.id, name: agent.name })}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#2a2a2a] overflow-hidden">
                {/* Replace with actual image */}
                <div className="w-full h-full bg-blue-500"></div>
              </div>
              <div>
                <h3 className="text-white font-medium">{agent.name}</h3>
                <p className="text-gray-400 text-sm">{agent.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Default List Section */}
      <div className="p-4 border-t border-[#2a2a2a]">
        <h4 className="text-gray-400 text-sm font-medium mb-2">Default List</h4>
        {/* Add default list items here */}
      </div>
    </div>
  );
} 