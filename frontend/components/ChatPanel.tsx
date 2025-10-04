"use client";

import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatHeader } from './ChatHeader';
import { ChatHistory } from './ChatHistory';
import { ChatComposer } from './ChatComposer';
import { useChatStore } from './useChatStore';

export function ChatPanel() {
    const { open, toggle } = useChatStore();

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                toggle(false);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [open, toggle]);

    // Desktop: Floating card
    const DesktopPanel = () => (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 hidden md:block"
                        onClick={() => toggle(false)}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-[90vw] max-w-[420px] h-[75vh] max-h-[700px] z-50 hidden md:block"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Chat with Rainbolt AI"
                    >
                        <div className="h-full flex flex-col bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl shadow-black/20 overflow-hidden">
                            <ChatHeader onClose={() => toggle(false)} onMinimize={() => toggle(false)} />
                            <ChatHistory />
                            <ChatComposer />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    // Mobile: Bottom sheet using Dialog
    const MobileSheet = () => (
        <Dialog.Root open={open} onOpenChange={toggle}>
            <Dialog.Portal>
                <Dialog.Overlay asChild>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    />
                </Dialog.Overlay>

                <Dialog.Content asChild>
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="fixed inset-x-0 bottom-0 z-50 md:hidden"
                        style={{
                            maxHeight: '85vh',
                            paddingBottom: 'env(safe-area-inset-bottom)',
                        }}
                    >
                        <div className="h-full flex flex-col bg-white/10 dark:bg-black/20 backdrop-blur-md border-t border-white/10 rounded-t-2xl shadow-xl shadow-black/20 overflow-hidden">
                            <VisuallyHidden.Root>
                                <Dialog.Title>Chat with Rainbolt AI</Dialog.Title>
                                <Dialog.Description>
                                    Ask questions and interact with Rainbolt AI assistant
                                </Dialog.Description>
                            </VisuallyHidden.Root>

                            {/* Drag handle */}
                            <div className="flex-shrink-0 flex justify-center pt-2 pb-1">
                                <div className="w-12 h-1 bg-white/20 rounded-full" />
                            </div>

                            <ChatHeader onClose={() => toggle(false)} />
                            <ChatHistory />
                            <ChatComposer />
                        </div>
                    </motion.div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );

    return (
        <>
            <DesktopPanel />
            <MobileSheet />
        </>
    );
}
