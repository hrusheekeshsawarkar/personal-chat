'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/chat';

interface ChatMainProps {
  chatId: string | null;
  selectedAgent?: { id: string; name: string };
}

export default function ChatMain({ chatId, selectedAgent }: ChatMainProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamedContent, setCurrentStreamedContent] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (chatId) {
      setCurrentChatId(chatId);
      fetchMessages();
    } else if (selectedAgent) {
      // Generate new chat ID when agent is selected but no chat exists
      setCurrentChatId(`${selectedAgent.id}-${Date.now()}`);
      setMessages([]);
    }
  }, [chatId, selectedAgent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/history/${chatId}`);
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const formatMessagesForLLM = (messages: Message[]) => {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  };

  const storeChatSession = async (messages: Message[]) => {
    try {
      await fetch('http://localhost:8000/api/chat/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: currentChatId,
          agent_id: selectedAgent?.id,
          messages: messages
        }),
      });
    } catch (error) {
      console.error('Error storing chat session:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message to state
    const newUserMessage: Message = { 
      role: 'user', 
      content: input, 
      timestamp: new Date().toISOString() 
    };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setCurrentStreamedContent('');

    try {
      const response = await fetch('http://localhost:8000/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formatMessagesForLLM(updatedMessages),
          chat_id: currentChatId,
          agent_id: selectedAgent?.id
        }),
      });

      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      // Add a temporary message for streaming
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '', 
        timestamp: new Date().toISOString() 
      }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                // Update the last message with the accumulated content
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = accumulatedContent;
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Store the complete chat session
      await storeChatSession([...updatedMessages, { 
        role: 'assistant', 
        content: accumulatedContent, 
        timestamp: new Date().toISOString() 
      }]);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1a1a1a]">
      {/* Chat Header */}
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-500"></div>
          <h2 className="text-white font-medium">{selectedAgent?.name || 'Just Chat'}</h2>
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
              {isLoading && index === messages.length - 1 && (
                <span className="inline-block animate-pulse">▊</span>
              )}
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
            disabled={isLoading}
          />
          <div className="absolute right-2 top-2 flex items-center space-x-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`${
                isLoading ? 'bg-pink-400' : 'bg-pink-600 hover:bg-pink-700'
              } text-white px-4 py-1 rounded-lg focus:outline-none transition-colors`}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 