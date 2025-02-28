'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loader from './Loader';

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

    // Add assistant message immediately with empty content
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: '',
      timestamp: new Date().toISOString() 
    }]);

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
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode the chunk and add it to our buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines from the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                // Update the message content immediately with each chunk
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage.role === 'assistant') {
                    lastMessage.content = accumulatedContent;
                  }
                  return newMessages;
                });
                
                // Scroll to bottom with each update
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 0);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      // Store the complete chat session after streaming is done
      await storeChatSession([...updatedMessages, { 
        role: 'assistant', 
        content: accumulatedContent, 
        timestamp: new Date().toISOString() 
      }]);

    } catch (error) {
      console.error('Error sending message:', error);
      // Show error in the message area
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = 'Sorry, there was an error processing your request.';
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatMarkdown = (content: string) => {
    // Convert ** to proper markdown bold
    content = content.replace(/\*\*(.*?)\*\*/g, '**$1**');
    
    // Add support for bullet points if they don't start with proper markdown
    content = content.split('\n').map(line => {
      if (line.trim().startsWith('•')) {
        return line.replace('•', '-');
      }
      return line;
    }).join('\n');
    
    return content;
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
      <div className="flex-1 overflow-y-auto p-4 hover:pr-2 transition-all duration-200">
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
              {message.role === 'assistant' ? (
                <>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    className="markdown-content"
                    components={{
                      p: ({node, ...props}) => <p className="mb-2" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-blue-300" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    }}
                  >
                    {formatMarkdown(message.content)}
                  </ReactMarkdown>
                  {isLoading && index === messages.length - 1 && message.content === '' && (
                    <div className="flex justify-center mt-2">
                      <Loader />
                    </div>
                  )}
                </>
              ) : (
                message.content
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
              {isLoading ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 