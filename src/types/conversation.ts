export interface Session {
  id: string;
  name: string;
  startTime: string;
  duration: string;
  turns: number;
  channel: string;
}

export interface Message {
  id: string;
  role: "user" | "agent" | "playbook";
  text: string;
  timestamp: string;
  latency?: number;
  playbookName?: string;
}

export interface Conversation {
  id: string;
  name: string;
  startTime: string;
  messages: Message[];
}
