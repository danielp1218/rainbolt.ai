"use client";

import EarthScene from "@/components/ui/globe";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatHistory } from "@/components/ChatHistory";
import { ChatComposer } from "@/components/ChatComposer";

export default function ChatPage() {
    return (
        <div className="relative h-screen w-screen overflow-hidden bg-black">
            {/* Globe - Centered on left side */}
            <div className="absolute inset-0 right-[420px] flex items-center justify-center">
                <div className="w-full h-full" style={{ transform: 'translateX(200px)' }}>
                    <EarthScene markers={[]} />
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
