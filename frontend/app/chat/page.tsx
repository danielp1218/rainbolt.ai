"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SimpleGlobe from "@/components/ui/simple-globe";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatHistory } from "@/components/ChatHistory";
import { ChatComposer } from "@/components/ChatComposer";
import { useChatStore } from "@/components/useChatStore";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Dropdown from "@/components/Dropdown";



export default function ChatPage() {
    const searchParams = useSearchParams();
    const uploadedImageUrl = useChatStore((state) => state.uploadedImageUrl);
    const router = useRouter();
    const [collapsibleOpen, setCollapsibleOpen] = useState(false);

    // Connect WebSocket when page mounts with session info
    useEffect(() => {
        const sessionId = searchParams.get('session');

        // Get stored state
        const store = useChatStore.getState();
        const { sessionId: storedSessionId, hasProcessedSession, connectWebSocket, markSessionProcessed } = store;

        console.log('Chat page mounted', {
            sessionId,
            storedSessionId,
            hasProcessedSession,
            hasUploadedImage: !!uploadedImageUrl
        });

        // Only connect if we have session info and haven't processed this exact session yet
        if (sessionId) {
            // Check if this is the same session we already processed
            if (storedSessionId === sessionId && hasProcessedSession) {
                console.log('Session already processed, skipping WebSocket connection');
                return;
            }

            // File path is always uploads/{sessionId}.{extension}
            // We'll send the session ID and backend will construct the path
            console.log('Connecting WebSocket from chat page...');
            connectWebSocket(sessionId).then(() => {
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
                    <SimpleGlobe markers={[{ lat: 41.799983, long: -72.209358 }]} />
                </div>
                {/* Vignette Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/80 pointer-events-none" />
            </div>
            {/* created backbutton */}
            <button
                onClick={() => router.push('/')}
                className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2
                bg-white/10 hover:bg-white/20 backdrop-blur-md
                border border-white/20 rounded-lg
                text-white font-medium text-sm
                transition-all duration-200 hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-white/50">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
            </button>

            {/* Dropdown Component */}
            <div className="absolute top-24 left-6 z-50">
                <Dropdown />
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
