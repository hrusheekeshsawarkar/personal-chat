'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/chat';

interface ChatMainProps {
  chatId: string | null;
}

export default function ChatMain({ chatId }: ChatMainProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (chatId) {
      fetchMessages();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/history/${chatId}`);
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, chatId }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'assistant', content: data.message }]);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a1a]">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-500"></div>
          <h2 className="text-white font-medium">Just Chat</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-500 mr-3 flex-shrink-0"></div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#2a2a2a] text-white'
              }`}
            >
              {message.content}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-500 ml-3 flex-shrink-0"></div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#2a2a2a]">
        <form onSubmit={sendMessage} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-[#2a2a2a] text-white rounded-lg px-4 py-3 pr-24 focus:outline-none"
            placeholder="Type your message here..."
          />
          <div className="absolute right-2 top-2 flex items-center space-x-2">
            <button
              type="submit"
              className="bg-pink-600 text-white px-4 py-1 rounded-lg hover:bg-pink-700 focus:outline-none"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 