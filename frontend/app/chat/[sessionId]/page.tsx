"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import SimpleGlobe from "@/components/ui/SimpleGlobe";
import { ChatHistory } from "@/components/ChatHistory";
import { ChatComposer } from "@/components/ChatComposer";
import { useChatStore } from "@/components/useChatStore";


export default function ChatPage() {
    const params = useParams();
    const sessionId = params.sessionId as string;
    const uploadedImageUrl = useChatStore((state) => state.uploadedImageUrl);
    const markers = useChatStore((state) => state.markers);
    const currentMarker = useChatStore((state) => state.currentMarker);
    const setCurrentMarker = useChatStore((state) => state.setCurrentMarker);
    const nextMarker = useChatStore((state) => state.nextMarker);
    const previousMarker = useChatStore((state) => state.previousMarker);
    const deleteMarker = useChatStore((state) => state.deleteMarker);
    const [isLocked, setIsLocked] = useState(false); // Start unlocked
    const hasLockedRef = useRef(false); // Track if we've already locked to markers
    const [mapillaryImages, setMapillaryImages] = useState<Record<number, string[]>>({});
    const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});

    // Connect WebSocket when page mounts with session info
    useEffect(() => {

        // Get stored state
        const store = useChatStore.getState();
        const { sessionId: storedSessionId, hasProcessedSession, ws, connectWebSocket } = store;

        console.log('Chat page mounted', {
            sessionId,
            storedSessionId,
            hasProcessedSession,
            hasActiveWs: !!ws,
            hasUploadedImage: !!uploadedImageUrl
        });

        // Only connect if we have session info
        if (sessionId) {
            // The store will handle checking if already connected/processed
            connectWebSocket(sessionId).then(() => {
                console.log('WebSocket connection established successfully');
            }).catch((err) => {
                console.error('Failed to connect WebSocket:', err);
            });
        }

        // Don't disconnect on cleanup - let the WebSocket persist
        // Only disconnect when explicitly navigating away or closing the page
    }, [sessionId, uploadedImageUrl]); // Re-run when session ID or image changes

    // Cleanup WebSocket on actual page navigation away
    useEffect(() => {
        return () => {
            // This cleanup runs when the component is actually being removed from the DOM
            // (not during React Strict Mode's double-mount)
            console.log('Chat page being removed, disconnecting WebSocket');
            useChatStore.getState().disconnectWebSocket();
        };
    }, []); // Empty deps - only run on actual mount/unmount

    // Lock globe when markers are loaded
    useEffect(() => {
        console.log('Markers updated, count:', markers.length);
        if (markers.length > 0) {
            if (!hasLockedRef.current) {
                console.log('Locking globe to first marker');
                setIsLocked(true);
                hasLockedRef.current = true;
            }
        } else {
            // If no markers, unlock the globe
            setIsLocked(false);
            hasLockedRef.current = false;
        }
    }, [markers.length]);

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
        long: m.longitude,
        confidence: m.accuracy * 100 // Convert accuracy from 0-1 to 0-100 scale
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
        <div className="relative h-screen w-screen bg-black flex">
            {/* Globe - Moved further to the right */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
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
                    <div 
                        className="absolute left-8 top-1/2 transform -translate-y-1/2 w-80 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 shadow-2xl z-10 pointer-events-auto max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
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
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-white font-semibold text-lg">{currentMarkerData.name}</h3>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Are you sure you want to delete this location?')) {
                                                        deleteMarker(currentMarker);
                                                        // Close the popup if no markers left
                                                        if (markers.length <= 1) {
                                                            setIsLocked(false);
                                                        }
                                                    }
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                className="text-white/60 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded"
                                                title="Delete location"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                            <a
                                                href={`https://www.google.com/maps/place/${currentMarkerData.latitude},${currentMarkerData.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white/60 hover:text-blue-400 transition-colors p-1.5 hover:bg-white/10 rounded"
                                                title="Open in Google Maps"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
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
                                    <p className="text-white/80 text-sm leading-relaxed max-h-30 overflow-y-auto">
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
                            <div className="overflow-y-auto px-4 space-y-3 pb-6" style={{ maxHeight: 'calc(80vh - 320px)' }}>
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
                    <div className="absolute bottom-8 left-[40%] transform flex items-center gap-4 bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 z-10">
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
            <div className="fixed top-0 right-0 bottom-0 w-[420px] flex flex-col bg-black/95 border-l border-white/10 shadow-2xl">
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
