"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import EarthScene from "@/components/ui/globe";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatHistory } from "@/components/ChatHistory";
import { ChatComposer } from "@/components/ChatComposer";
import { useChatStore } from "@/components/useChatStore";

export default function ChatPage() {
    const searchParams = useSearchParams();
    const uploadedImageUrl = useChatStore((state) => state.uploadedImageUrl);
    
    // Connect WebSocket when page mounts with session info
    useEffect(() => {
        const sessionId = searchParams.get('session');
        const filePath = searchParams.get('file');
        
        // Get stored state
        const store = useChatStore.getState();
        const { sessionId: storedSessionId, hasProcessedSession, connectWebSocket, markSessionProcessed } = store;
        
        console.log('Chat page mounted', { 
            sessionId, 
            filePath, 
            storedSessionId, 
            hasProcessedSession,
            hasUploadedImage: !!uploadedImageUrl 
        });
        
        // Only connect if we have session info and haven't processed this exact session yet
        if (sessionId && filePath) {
            // Check if this is the same session we already processed
            if (storedSessionId === sessionId && hasProcessedSession) {
                console.log('Session already processed, skipping WebSocket connection');
                return;
            }
            
            console.log('Connecting WebSocket from chat page...');
            connectWebSocket(sessionId, filePath, uploadedImageUrl || undefined).then(() => {
                // Mark this session as processed after successful connection
                markSessionProcessed(sessionId);
            }).catch((err) => {
                console.error('Failed to connect WebSocket:', err);
            });
        }
        
        return () => {
            console.log('Chat page unmounting, disconnecting WebSocket');
            // Get the latest disconnectWebSocket from store in cleanup
            useChatStore.getState().disconnectWebSocket();
        };
    }, [searchParams, uploadedImageUrl]); // Re-run when URL params or image changes
    
    return (
        <div className="relative h-screen w-screen overflow-hidden bg-black">
            {/* Globe - Centered on left side */}
            <div className="absolute inset-0 right-[420px] flex items-center justify-center">
                <div className="w-full h-full" style={{ transform: 'translateX(200px)' }}>
                    {/*<EarthScene markers={[]} />*/}
                </div>
                {/* Vignette Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/80 pointer-events-none" />
            </div>

            {/* Fixed Chat Panel - Right Side */}
            <div className="absolute top-0 right-0 bottom-0 w-[420px] flex flex-col bg-black/95 border-l border-white/10 shadow-2xl">
                {/* Modified header without close button */}
                <div className="flex-shrink-0 border-b border-white/20 p-4 bg-black/60">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        </div>
                        <h2 className="text-white font-medium text-base">Rainbolt AI</h2>
                    </div>
                </div>

                {/* Uploaded Image Preview */}
                {uploadedImageUrl && (
                    <div className="flex-shrink-0 p-4 border-b border-white/10">
                        <div className="relative rounded-lg overflow-hidden bg-black/50">
                            <img 
                                src={uploadedImageUrl} 
                                alt="Uploaded image" 
                                className="w-full h-32 object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* Chat Content */}
                <ChatHistory />
                <ChatComposer />
            </div>

            {/* Mobile Warning - Chat page is desktop only */}
            <div className="md:hidden fixed inset-0 bg-black flex items-center justify-center p-4 z-50">
                <div className="text-center">
                    <h2 className="text-white text-2xl font-bold mb-4">Desktop Only</h2>
                    <p className="text-white/70">
                        The chat interface is optimized for desktop viewing. Please visit this page on a larger screen.
                    </p>
                </div>
            </div>
        </div>
    );
}
