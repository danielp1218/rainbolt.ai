import { create } from 'zustand';
import { sendMessageMock } from '@/lib/chatMock';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
};

type ChatState = {
  open: boolean;
  messages: Message[];
  sending: boolean;
  send: (text: string) => Promise<void>;
  toggle: (value?: boolean) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  open: false,
  messages: [],
  sending: false,

  toggle: (value?: boolean) => {
    set((state) => ({
      open: value !== undefined ? value : !state.open,
    }));
  },

  send: async (text: string) => {
    if (!text.trim() || get().sending) return;

    // Immediately add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      ts: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      sending: true,
    }));

    try {
      // Call mock API
      const response = await sendMessageMock(text);

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response.text,
        ts: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        sending: false,
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      set({ sending: false });
    }
  },

  clear: () => {
    set({ messages: [] });
  },
}));
