"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useChatStore } from './useChatStore';

export function ChatLauncher() {
    const { toggle, open, messages } = useChatStore();
    const [mounted, setMounted] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // Handle mount animation
    useEffect(() => {
        setMounted(true);
    }, []);

    // Show unread indicator when panel is closed and new assistant message arrives
    useEffect(() => {
        if (!open && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant') {
                setHasUnread(true);
            }
        }

        // Clear unread when panel opens
        if (open) {
            setHasUnread(false);
        }
    }, [messages, open]);

    if (open) return null;

    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={mounted ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 0.1,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggle(true)}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 p-4 rounded-full bg-blue-500 hover:bg-blue-600 shadow-xl shadow-blue-500/25 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent pointer-events-auto"
            aria-label="Open chat"
        >
            <MessageCircle className="w-6 h-6 text-white" />

            {/* Unread indicator */}
            {hasUnread && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black"
                />
            )}

            {/* Pulse animation */}
            <motion.div
                className="absolute inset-0 rounded-full bg-blue-500"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </motion.button>
    );
}
