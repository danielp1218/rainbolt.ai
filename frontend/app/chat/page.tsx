"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SimpleGlobe from "@/components/ui/simple-globe";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatHistory } from "@/components/ChatHistory";
import { ChatComposer } from "@/components/ChatComposer";
import { useChatStore } from "@/components/useChatStore";


export default function ChatPage() {
    const searchParams = useSearchParams();
    const uploadedImageUrl = useChatStore((state) => state.uploadedImageUrl);
    const markers = useChatStore((state) => state.markers);
    const currentMarker = useChatStore((state) => state.currentMarker);
    const nextMarker = useChatStore((state) => state.nextMarker);
    const previousMarker = useChatStore((state) => state.previousMarker);
    const [isLocked, setIsLocked] = useState(true);
    
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
    
    // Test markers - will be replaced by actual markers from WebSocket
    useEffect(() => {
        if (markers.length === 0) {
            // Set test markers on initial load
            useChatStore.getState().setMarkers([
                {
                    latitude: 41.799983,
                    longitude: -72.209358,
                    accuracy: 0.85,
                    facts: "Hartford, Connecticut - Capital city with distinctive architecture"
                },
                {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    accuracy: 0.92,
                    facts: "New York City - Iconic skyline and dense urban environment"
                },
                {
                    latitude: 51.5074,
                    longitude: -0.1278,
                    accuracy: 0.78,
                    facts: "London, UK - Historic landmarks and Thames River visible"
                }
            ]);
        }
    }, []);

    // Convert all markers to SimpleGlobe format
    const globeMarkers = markers.map(m => ({ 
        lat: m.latitude, 
        long: m.longitude 
    }));

    // Handler for when a marker is clicked
    const handleMarkerClick = (index: number) => {
        // Update current marker to the clicked one
        if (index >= 0 && index < markers.length) {
            // Set the marker in the store
            let currentIdx = 0;
            const setCurrentMarker = () => {
                const state = useChatStore.getState();
                // Find and set the correct index
                for (let i = 0; i < index; i++) {
                    state.nextMarker();
                }
            };
            // Reset to 0 first, then navigate to target
            while (useChatStore.getState().currentMarker !== 0) {
                useChatStore.getState().previousMarker();
            }
            for (let i = 0; i < index; i++) {
                useChatStore.getState().nextMarker();
            }
        }
    };

    // Get current marker data
    const currentMarkerData = markers.length > 0 && currentMarker < markers.length 
        ? markers[currentMarker] 
        : null;

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-black">
            {/* Globe - Moved further to the right */}
            <div className="absolute inset-0 right-[420px] flex items-center justify-center">
                <div className="w-full h-full" style={{ transform: 'translateX(300px)' }}>
                    <SimpleGlobe 
                        markers={globeMarkers} 
                        targetMarkerIndex={currentMarker} 
                        isLocked={isLocked}
                        onUnlock={() => setIsLocked(false)}
                        onLock={() => setIsLocked(true)}
                        onMarkerClick={handleMarkerClick}
                    />
                </div>
                {/* Vignette Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/80 pointer-events-none" />

                {/* Location Facts Popup - Left Side */}
                {isLocked && currentMarkerData && (
                    <div className="absolute left-8 top-1/2 transform -translate-y-1/2 w-80 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 p-6 shadow-2xl">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-semibold text-lg mb-1">Location {currentMarker + 1}</h3>
                                <div className="flex items-center gap-2 text-white/60 text-xs">
                                    <span>{currentMarkerData.latitude.toFixed(4)}°N</span>
                                    <span>•</span>
                                    <span>{currentMarkerData.longitude.toFixed(4)}°E</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-white/50 text-xs uppercase tracking-wider">Accuracy</span>
                                    <div className="flex-1 h-px bg-white/10"></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                                            style={{ width: `${currentMarkerData.accuracy * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-white font-medium text-sm">{(currentMarkerData.accuracy * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-white/50 text-xs uppercase tracking-wider">Analysis</span>
                                    <div className="flex-1 h-px bg-white/10"></div>
                                </div>
                                <p className="text-white/80 text-sm leading-relaxed">
                                    {currentMarkerData.facts}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Lock/Unlock Toggle Button */}
                <div className="absolute top-8 left-8">
                    <button
                        onClick={() => setIsLocked(!isLocked)}
                        className="bg-black/80 backdrop-blur-sm rounded-full p-3 border border-white/20 text-white hover:bg-white/10 transition-colors"
                        aria-label={isLocked ? "Unlock globe" : "Lock globe"}
                        title={isLocked ? "Unlock for free rotation" : "Lock to marker"}
                    >
                        {isLocked ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                            </svg>
                        )}
                    </button>
                </div>
                
                {/* Marker Navigation Buttons */}
                {markers.length > 1 && (
                    <div className="absolute bottom-8 left-[60%] transform flex items-center gap-4 bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                        <button
                            onClick={() => {
                                setIsLocked(true);
                                previousMarker();
                            }}
                            className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full"
                            aria-label="Previous marker"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="text-white font-medium text-sm">
                            {currentMarker + 1} / {markers.length}
                        </div>
                        <button
                            onClick={() => {
                                setIsLocked(true);
                                nextMarker();
                            }}
                            className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full"
                            aria-label="Next marker"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
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
