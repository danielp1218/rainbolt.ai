"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SimpleGlobe from "@/components/ui/simple-globe";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatHistory } from "@/components/ChatHistory";
import { ChatComposer } from "@/components/ChatComposer";
import { useChatStore } from "@/components/useChatStore";
import LoginComponent from "@/components/ui/Login_component";


export default function ChatPage() {
    const searchParams = useSearchParams();
    const uploadedImageUrl = useChatStore((state) => state.uploadedImageUrl);
    const markers = useChatStore((state) => state.markers);
    const currentMarker = useChatStore((state) => state.currentMarker);
    const setCurrentMarker = useChatStore((state) => state.setCurrentMarker);
    const nextMarker = useChatStore((state) => state.nextMarker);
    const previousMarker = useChatStore((state) => state.previousMarker);
    const [isLocked, setIsLocked] = useState(true);
    const [mapillaryImages, setMapillaryImages] = useState<Record<number, string[]>>({});
    const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});

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
        console.log('Markers updated:', markers);
    }, [markers]);

    // Fetch Mapillary images when current marker changes
    useEffect(() => {
        const fetchMapillaryImages = async () => {
            if (markers.length === 0 || currentMarker >= markers.length) return;
            
            const marker = markers[currentMarker];
            
            // Skip if we already have images for this marker or if it already has images from backend
            if (mapillaryImages[currentMarker] || marker.mapillary_images) {
                if (marker.mapillary_images) {
                    setMapillaryImages(prev => ({
                        ...prev,
                        [currentMarker]: marker.mapillary_images || []
                    }));
                }
                return;
            }
            
            // Skip if already loading
            if (loadingImages[currentMarker]) return;
            
            setLoadingImages(prev => ({ ...prev, [currentMarker]: true }));
            
            try {
                const response = await fetch('http://localhost:8000/api/mapillary-images', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        latitude: marker.latitude,
                        longitude: marker.longitude,
                        radius: 0.003,
                        limit: 5
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setMapillaryImages(prev => ({
                        ...prev,
                        [currentMarker]: data.images || []
                    }));
                } else {
                    console.error('Failed to fetch Mapillary images:', response.statusText);
                    setMapillaryImages(prev => ({
                        ...prev,
                        [currentMarker]: []
                    }));
                }
            } catch (error) {
                console.error('Error fetching Mapillary images:', error);
                setMapillaryImages(prev => ({
                    ...prev,
                    [currentMarker]: []
                }));
            } finally {
                setLoadingImages(prev => ({ ...prev, [currentMarker]: false }));
            }
        };
        
        fetchMapillaryImages();
    }, [currentMarker, markers]);

    // Convert all markers to SimpleGlobe format
    const globeMarkers = markers.map(m => ({
        lat: m.latitude,
        long: m.longitude
    }));

    console.log('Globe markers:', globeMarkers, 'Total markers:', markers.length);

    // Handler for when a marker is clicked
    const handleMarkerClick = (index: number) => {
        console.log('Marker clicked, setting to index:', index);
        setCurrentMarker(index);
        setIsLocked(true);
    };

    // Get current marker data
    const currentMarkerData = markers.length > 0 && currentMarker < markers.length
        ? markers[currentMarker]
        : null;

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-black">
            {/* Globe - Moved further to the right */}
            <div className="absolute inset-0 right-[420px] flex items-center justify-center">
                <div className="w-full h-full">
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
                    <div className="absolute left-8 top-1/2 transform -translate-y-1/2 w-80 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 shadow-2xl z-10 pointer-events-auto max-h-[80vh] flex flex-col">
                        <div className="flex-shrink-0 p-6 pb-4">
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

                        {/* Scrollable Mapillary Images Section */}
                        <div className="flex-1 overflow-hidden border-t border-white/10">
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-white/50 text-xs uppercase tracking-wider">Street View Images</span>
                                    <div className="flex-1 h-px bg-white/10"></div>
                                    {loadingImages[currentMarker] && (
                                        <div className="animate-spin h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-y-auto px-4 pb-4 space-y-3" style={{ maxHeight: 'calc(80vh - 320px)' }}>
                                {loadingImages[currentMarker] ? (
                                    <div className="text-white/50 text-sm text-center py-8">
                                        Loading street view images...
                                    </div>
                                ) : mapillaryImages[currentMarker] && mapillaryImages[currentMarker].length > 0 ? (
                                    mapillaryImages[currentMarker].map((imageUrl, index) => (
                                        <div key={index} className="relative rounded-lg overflow-hidden bg-black/50 border border-white/10 hover:border-blue-400/50 transition-all group">
                                            <img
                                                src={imageUrl}
                                                alt={`Street view ${index + 1}`}
                                                className="w-full h-40 object-cover"
                                                onError={(e) => {
                                                    // Hide broken images
                                                    e.currentTarget.parentElement!.style.display = 'none';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                <span className="text-white text-xs">Image {index + 1}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-white/50 text-sm text-center py-8">
                                        No street view images available for this location
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Marker Navigation Buttons */}
                {markers.length > 1 && (
                    <div className="absolute bottom-8 left-[50%] transform flex items-center gap-4 bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 z-10">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsLocked(true);
                                previousMarker();
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsLocked(true);
                                nextMarker();
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
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
