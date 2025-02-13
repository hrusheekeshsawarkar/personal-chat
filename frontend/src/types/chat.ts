export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatSession {
  id: string;
  agent_id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
} 