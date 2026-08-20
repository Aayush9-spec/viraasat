export type AgentType = 'Buyer Agent' | 'Artisan Agent' | 'Cultural Research Agent';

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  agent?: AgentType;
  image?: string;
  suggestions?: string[];
}
