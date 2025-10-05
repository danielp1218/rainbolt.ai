import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Message = {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    ts: number;
};

export type Marker = {
    latitude: number;
    longitude: number;
    accuracy: number;
    facts: string;
    mapillary_images?: string[];
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
    markers: Marker[];
    currentMarker: number;
    send: (text: string) => Promise<void>;
    toggle: (value?: boolean) => void;
    clear: () => void;
    connectWebSocket: (sessionId: string) => Promise<void>;
    disconnectWebSocket: () => void;
    markSessionProcessed: (sessionId: string) => void;
    setMarkers: (markers: Marker[]) => void;
    setCurrentMarker: (index: number) => void;
    nextMarker: () => void;
    previousMarker: () => void;
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
            markers: [],
            currentMarker: 0,

            toggle: (value?: boolean) => {
                set((state) => ({
                    open: value !== undefined ? value : !state.open,
                }));
            },

            markSessionProcessed: (sessionId: string) => {
                set({ sessionId, hasProcessedSession: true });
            },

            setMarkers: (markers: Marker[]) => {
                set({ markers, currentMarker: 0 });
            },

            setCurrentMarker: (index: number) => {
                const state = get();
                if (index >= 0 && index < state.markers.length) {
                    set({ currentMarker: index });
                }
            },

            nextMarker: () => {
                const state = get();
                if (state.markers.length === 0) return;
                set({ currentMarker: (state.currentMarker + 1) % state.markers.length });
            },

            previousMarker: () => {
                const state = get();
                if (state.markers.length === 0) return;
                set({ 
                    currentMarker: state.currentMarker === 0 
                        ? state.markers.length - 1 
                        : state.currentMarker - 1 
                });
            },

    connectWebSocket: (sessionId: string) => {
        return new Promise<void>((resolve, reject) => {
            const state = get();
            
            // Check if this session has already been processed
            if (state.sessionId === sessionId && state.hasProcessedSession) {
                console.log('Session already processed, skipping process_image message');
                
                // Still connect WebSocket for chat functionality, but don't process image again
                const ws = new WebSocket(`ws://localhost:8000/ws/chat/${sessionId}`);
                
                ws.onopen = () => {
                    console.log('WebSocket connected (already processed session)');
                    set({ sessionId, ws });
                    resolve();
                };
                
                // Set up message handlers (same as below)
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    const state = get();

                    if (data.type === 'status') {
                        // Update thinking status
                        set({ thinking: true });
                    } else if (data.type === 'reasoning_chunk' || data.type === 'chat_response_chunk') {
                        // Append to current assistant message (streaming)
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
                    } else if (data.type === 'coordinates') {
                        // Handle coordinates as a separate formatted message
                        try {
                            console.log('Received coordinates, raw text:', data.text);
                            
                            // Try to extract JSON from the text more robustly
                            let cleanedText = data.text;
                            
                            // Remove markdown code blocks
                            cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                            
                            // Try to find JSON array in the text
                            const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
                            if (jsonMatch) {
                                cleanedText = jsonMatch[0];
                            }
                            
                            console.log('Cleaned coordinates text:', cleanedText);
                            const coordinates = JSON.parse(cleanedText);
                            console.log('Parsed coordinates:', coordinates);
                            
                            const formattedCoords = coordinates.map((coord: any, index: number) =>
                                `${index + 1}. Latitude: ${coord.latitude}, Longitude: ${coord.longitude}`
                            ).join('\n');

                            const coordsMessage = `📍 Predicted Coordinates:\n${formattedCoords}`;

                            const newMessage: Message = {
                                id: `assistant-${Date.now()}`,
                                role: 'assistant',
                                text: coordsMessage,
                                ts: Date.now()
                            };
                            set({ messages: [...state.messages, newMessage] });

                            // Parse coordinates into markers for the globe
                            const newMarkers: Marker[] = coordinates.map((coord: any) => ({
                                latitude: coord.latitude,
                                longitude: coord.longitude,
                                accuracy: coord.accuracy / 100, // Convert percentage to decimal
                                facts: Array.isArray(coord.facts) ? coord.facts.join('. ') : coord.facts
                            }));
                            
                            console.log('Setting markers from coordinates:', newMarkers);
                            set({ markers: newMarkers, currentMarker: 0 });

                        } catch (e) {
                            console.error('Failed to parse coordinates:', e, 'Raw data:', data.text);
                        }
                    } else if (data.type === 'complete') {
                        // Analysis complete
                        console.log('Received complete message, resetting sending and thinking flags');

                        // Clear any pending timeout
                        const ws = get().ws;
                        if (ws && (ws as any).sendingTimeout) {
                            clearTimeout((ws as any).sendingTimeout);
                            delete (ws as any).sendingTimeout;
                        }

                        set({ thinking: false, sending: false, currentAssistantMessage: '' });
                    } else if (data.type === 'error') {
                        // Handle error

                        // Clear any pending timeout
                        const ws = get().ws;
                        if (ws && (ws as any).sendingTimeout) {
                            clearTimeout((ws as any).sendingTimeout);
                            delete (ws as any).sendingTimeout;
                        }

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
                    
                    // Attempt to reconnect if connection was not closed intentionally
                    if (!event.wasClean && event.code !== 1000) {
                        const currentSessionId = get().sessionId;
                        if (currentSessionId) {
                            console.log('Connection lost unexpectedly, will reconnect on next send');
                        }
                    }
                };
                
                return; // Exit early, skip the normal connection flow below
            }
            
            console.log('Connecting to WebSocket...', { sessionId });
            const ws = new WebSocket(`ws://localhost:8000/ws/chat/${sessionId}`);
            
            ws.onopen = () => {
                console.log('WebSocket connected, sending process_image request');
                set({ thinking: true, sessionId, ws });
                
                // Send process image request
                const message = {
                    type: 'process_image',
                    session_id: sessionId
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
                        } else if (data.type === 'reasoning_chunk' || data.type === 'chat_response_chunk') {
                            // Append to current assistant message (streaming)
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
                        } else if (data.type === 'coordinates') {
                            // Handle coordinates as a separate formatted message
                            try {
                                console.log('Received coordinates, raw text:', data.text);
                                
                                // Try to extract JSON from the text more robustly
                                let cleanedText = data.text;
                                
                                // Remove markdown code blocks
                                cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                                
                                // Try to find JSON array in the text
                                const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
                                if (jsonMatch) {
                                    cleanedText = jsonMatch[0];
                                }
                                
                                console.log('Cleaned coordinates text:', cleanedText);
                                const coordinates = JSON.parse(cleanedText);
                                console.log('Parsed coordinates:', coordinates);
                                
                                const formattedCoords = coordinates.map((coord: any, index: number) =>
                                    `${index + 1}. Latitude: ${coord.latitude}, Longitude: ${coord.longitude}`
                                ).join('\n');

                                const coordsMessage = `📍 Predicted Coordinates:\n${formattedCoords}`;

                                const newMessage: Message = {
                                    id: `assistant-${Date.now()}`,
                                    role: 'assistant',
                                    text: coordsMessage,
                                    ts: Date.now()
                                };
                                set({ messages: [...state.messages, newMessage] });

                                // Parse coordinates into markers for the globe
                                const newMarkers: Marker[] = coordinates.map((coord: any) => ({
                                    latitude: coord.latitude,
                                    longitude: coord.longitude,
                                    accuracy: coord.accuracy / 100, // Convert percentage to decimal
                                    facts: Array.isArray(coord.facts) ? coord.facts.join('. ') : coord.facts
                                }));
                                
                                console.log('Setting markers from coordinates:', newMarkers);
                                set({ markers: newMarkers, currentMarker: 0 });

                            } catch (e) {
                                console.error('Failed to parse coordinates:', e, 'Raw data:', data.text);
                            }
                        } else if (data.type === 'complete') {
                            // Analysis complete
                            console.log('Received complete message, resetting sending and thinking flags');

                            // Clear any pending timeout
                            const ws = get().ws;
                            if (ws && (ws as any).sendingTimeout) {
                                clearTimeout((ws as any).sendingTimeout);
                                delete (ws as any).sendingTimeout;
                            }

                            set({ thinking: false, sending: false, currentAssistantMessage: '' });
                        } else if (data.type === 'error') {
                            // Handle error

                            // Clear any pending timeout
                            const ws = get().ws;
                            if (ws && (ws as any).sendingTimeout) {
                                clearTimeout((ws as any).sendingTimeout);
                                delete (ws as any).sendingTimeout;
                            }

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
                        
                        // Attempt to reconnect if connection was not closed intentionally
                        if (!event.wasClean && event.code !== 1000) {
                            const currentSessionId = get().sessionId;
                            if (currentSessionId) {
                                console.log('Connection lost unexpectedly, will reconnect on next send');
                            }
                        }
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
                const state = get();
                console.log('Send called, state:', { sending: state.sending, hasWs: !!state.ws, textLength: text.trim().length });

                if (!text.trim() || state.sending) {
                    console.log('Send blocked:', {
                        noText: !text.trim(),
                        sending: state.sending
                    });
                    return;
                }

                // If WebSocket is not connected but we have a sessionId, reconnect
                if (!state.ws && state.sessionId) {
                    console.log('WebSocket disconnected, attempting to reconnect...');
                    try {
                        await get().connectWebSocket(state.sessionId);
                        console.log('Reconnected successfully');
                    } catch (error) {
                        console.error('Failed to reconnect WebSocket:', error);
                        const errorMessage: Message = {
                            id: `error-${Date.now()}`,
                            role: 'assistant',
                            text: 'Connection lost. Please refresh the page to continue.',
                            ts: Date.now()
                        };
                        set({ messages: [...state.messages, errorMessage] });
                        return;
                    }
                }

                // Check again after potential reconnection
                const currentState = get();
                if (!currentState.ws) {
                    console.log('Send blocked: no WebSocket connection');
                    return;
                }

                // Immediately add user message
                const userMessage: Message = {
                    id: `user-${Date.now()}`,
                    role: 'user',
                    text: text.trim(),
                    ts: Date.now(),
                };

                // Get fresh state after potential reconnection
                const freshStateForMessage = get();
                set({
                    messages: [...freshStateForMessage.messages, userMessage],
                    sending: true,
                    thinking: true,
                    currentAssistantMessage: '', // Reset for new response
                });

                // Add timeout to reset sending flag if no response after 30 seconds
                const sendingTimeout = setTimeout(() => {
                    console.warn('Message send timeout - resetting sending flag');
                    set({ sending: false, thinking: false });
                }, 30000); // 30 second timeout

                try {
                    // Get fresh state to include the user message we just added
                    const freshState = get();
                    
                    // Get session ID from stored state (backend will construct file path)
                    const sessionId = freshState.sessionId;

                    if (!sessionId) {
                        clearTimeout(sendingTimeout);
                        throw new Error('No session ID available');
                    }

                    if (!freshState.ws) {
                        clearTimeout(sendingTimeout);
                        throw new Error('WebSocket not connected');
                    }

                    // Send chat message with full history
                    const chatMessage = {
                        type: 'chat_message',
                        text: text.trim(),
                        session_id: sessionId,
                        history: freshState.messages.map(msg => ({
                            role: msg.role,
                            text: msg.text
                        }))
                    };

                    console.log('Sending chat message:', chatMessage);
                    freshState.ws.send(JSON.stringify(chatMessage));

                    // Store timeout ID so we can clear it when response arrives
                    (freshState.ws as any).sendingTimeout = sendingTimeout;
                } catch (error) {
                    console.error('Failed to send message:', error);
                    clearTimeout(sendingTimeout);
                    set({ sending: false, thinking: false });
                }
            },

    clear: () => {
        set({ messages: [], currentAssistantMessage: '', uploadedImageUrl: null, hasProcessedSession: false, markers: [], currentMarker: 0 });
    },
        }),
        {
            name: 'rainbolt-chat-storage',
            partialize: (state) => ({
                messages: state.messages,
                sessionId: state.sessionId,
                uploadedImageUrl: state.uploadedImageUrl,
                hasProcessedSession: state.hasProcessedSession,
                markers: state.markers,
                currentMarker: state.currentMarker,
            }),
        }
    )
);
