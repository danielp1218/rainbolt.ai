import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    thinking: boolean;
    ws: WebSocket | null;
    sessionId: string | null;
    currentAssistantMessage: string;
    uploadedImageUrl: string | null;
    hasProcessedSession: boolean; // Track if we've already processed this session
    send: (text: string) => Promise<void>;
    toggle: (value?: boolean) => void;
    clear: () => void;
    connectWebSocket: (sessionId: string, filePath: string, imageUrl?: string) => Promise<void>;
    disconnectWebSocket: () => void;
    markSessionProcessed: (sessionId: string) => void;
};

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            open: false,
            messages: [],
            sending: false,
            thinking: false,
            ws: null,
            sessionId: null,
            currentAssistantMessage: '',
            uploadedImageUrl: null,
            hasProcessedSession: false,

            toggle: (value?: boolean) => {
                set((state) => ({
                    open: value !== undefined ? value : !state.open,
                }));
            },

            markSessionProcessed: (sessionId: string) => {
                set({ sessionId, hasProcessedSession: true });
            },

    connectWebSocket: (sessionId: string, filePath: string, imageUrl?: string) => {
        return new Promise<void>((resolve, reject) => {
            // Store the image URL if provided
            if (imageUrl) {
                set({ uploadedImageUrl: imageUrl });
            }
            
            console.log('Connecting to WebSocket...', { sessionId, filePath });
            const ws = new WebSocket(`ws://localhost:8000/ws/chat/${sessionId}`);
            
            ws.onopen = () => {
                console.log('WebSocket connected, sending process_image request');
                set({ thinking: true, sessionId, ws });
                
                // Send process image request
                const message = {
                    type: 'process_image',
                    file_path: filePath
                };
                console.log('Sending message:', message);
                ws.send(JSON.stringify(message));
                
                // Wait a bit for message to be sent before resolving
                setTimeout(() => {
                    console.log('Message sent, resolving promise');
                    resolve();
                }, 50);
            };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const state = get();

            if (data.type === 'status') {
                // Update thinking status
                set({ thinking: true });
            } else if (data.type === 'reasoning_chunk' || data.type === 'coordinates_chunk') {
                // Append to current assistant message
                const updatedText = state.currentAssistantMessage + data.text;
                set({ currentAssistantMessage: updatedText });

                // Update or create assistant message
                const lastMessage = state.messages[state.messages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                    // Update existing message
                    const updatedMessages = [...state.messages];
                    updatedMessages[updatedMessages.length - 1] = {
                        ...lastMessage,
                        text: updatedText
                    };
                    set({ messages: updatedMessages });
                } else {
                    // Create new message
                    const newMessage: Message = {
                        id: `assistant-${Date.now()}`,
                        role: 'assistant',
                        text: updatedText,
                        ts: Date.now()
                    };
                    set({ messages: [...state.messages, newMessage] });
                }
            } else if (data.type === 'complete') {
                // Analysis complete
                set({ thinking: false, sending: false, currentAssistantMessage: '' });
            } else if (data.type === 'error') {
                // Handle error
                const errorMessage: Message = {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    text: `Error: ${data.message}`,
                    ts: Date.now()
                };
                set({ 
                    messages: [...state.messages, errorMessage],
                    thinking: false,
                    sending: false,
                    currentAssistantMessage: ''
                });
            }
        };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                set({ thinking: false, sending: false });
                reject(error);
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed', { 
                    code: event.code, 
                    reason: event.reason, 
                    wasClean: event.wasClean 
                });
                set({ thinking: false, sending: false, ws: null });
            };
        });
    },

    disconnectWebSocket: () => {
        const { ws } = get();
        if (ws) {
            ws.close();
            set({ ws: null, thinking: false, sending: false });
        }
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

        // For now, just echo back (you can extend this for chat)
        setTimeout(() => {
            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                text: 'Chat functionality coming soon!',
                ts: Date.now(),
            };

            set((state) => ({
                messages: [...state.messages, assistantMessage],
                sending: false,
            }));
        }, 1000);
    },

    clear: () => {
        set({ messages: [], currentAssistantMessage: '', uploadedImageUrl: null, hasProcessedSession: false });
    },
        }),
        {
            name: 'rainbolt-chat-storage',
            partialize: (state) => ({
                messages: state.messages,
                sessionId: state.sessionId,
                uploadedImageUrl: state.uploadedImageUrl,
                hasProcessedSession: state.hasProcessedSession,
            }),
        }
    )
);
