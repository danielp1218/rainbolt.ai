'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth0Firebase } from '@/hooks/useAuth0Firebase';
import { useGlobeSessions } from '@/hooks/useGlobeSessions';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/ui/navbar';
import { GlobeSession } from '@/lib/globe-database';
import { Plus, Star, Globe, X, Trash2, Settings, Link } from 'lucide-react';

interface ConstellationNode {
  id: string;
  session: GlobeSession;
  position: { x: number; y: number };
  isDragging: boolean;
}

// Constellation Node Component
const ConstellationNode: React.FC<{
  node: ConstellationNode;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: () => void;
  onDelete: () => void;
  onCreateLink: () => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  linkCopied: boolean;
  isLinking: boolean;
  isLinkingFrom: boolean;
}> = ({ node, onMouseDown, onClick, onDelete, onCreateLink, isSettingsOpen, onToggleSettings, linkCopied, isLinking, isLinkingFrom }) => {
  return (
    <div
      data-node-id={node.id}
      className={`absolute select-none ${
        node.isDragging ? 'z-50' : 'z-10'
      } ${isLinking && !isLinkingFrom ? 'cursor-pointer' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: node.isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: node.isDragging ? 'none' : 'transform 0.1s ease-out',
      }}
    >
      <div className="relative group">
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-xl blur-md transition-all duration-300 ${
          isLinkingFrom 
            ? 'bg-gradient-to-br from-yellow-400/40 to-orange-600/40 group-hover:blur-lg animate-pulse' 
            : isLinking && !isLinkingFrom
            ? 'bg-gradient-to-br from-green-400/30 to-blue-600/30 group-hover:blur-lg group-hover:from-green-400/50 group-hover:to-blue-600/50'
            : 'bg-gradient-to-br from-blue-400/20 to-purple-600/20 group-hover:blur-lg'
        }`} />
        
        {/* Main card container */}
        <div className={`relative backdrop-blur-md border rounded-xl w-48 overflow-hidden ${
          isLinkingFrom
            ? 'bg-yellow-500/10 border-yellow-400/30'
            : isLinking && !isLinkingFrom
            ? 'bg-green-500/10 border-green-400/30 hover:bg-green-500/20'
            : 'bg-white/5 border-white/10'
        }`}>
          {/* Draggable Handle Bar */}
          <div 
            className="bg-gradient-to-r from-blue-500/40 to-purple-500/40 border-b border-white/10 p-2 hover:from-blue-500/60 hover:to-purple-500/60 transition-colors duration-100"
          >
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center space-x-1 cursor-move flex-1"
                onMouseDown={onMouseDown}
              >
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                <span className="text-xs text-white/70 font-medium ml-2">DRAG</span>
              </div>
              
              {/* Settings/Delete Button */}
              {!isSettingsOpen ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSettings();
                  }}
                  className="p-1 rounded hover:bg-white/20 transition-colors group"
                  title="Settings"
                >
                  <Settings className="w-3 h-3 text-white/60 group-hover:text-white" />
                </button>
              ) : (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="p-1 rounded hover:bg-red-500/30 transition-colors group"
                    title="Delete session"
                  >
                    <Trash2 className="w-3 h-3 text-white/60 group-hover:text-red-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateLink();
                    }}
                    className="p-1 rounded hover:bg-blue-500/30 transition-colors group"
                    title={linkCopied ? "Link copied!" : "Create shareable link"}
                  >
                    <Link className={`w-3 h-3 transition-colors ${linkCopied ? 'text-green-400' : 'text-white/60 group-hover:text-blue-400'}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSettings();
                    }}
                    className="p-1 rounded hover:bg-white/20 transition-colors group"
                    title="Close settings"
                  >
                    <X className="w-3 h-3 text-white/60 group-hover:text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Clickable content area */}
          <div 
            className="p-4 cursor-pointer hover:bg-white/5 transition-colors duration-100"
            onClick={(e) => {
              if (isLinking) {
                e.stopPropagation();
              }
              onClick();
            }}
          >
            {/* Status indicator */}
            <div className="absolute -top-2 -right-2">
              <div className={`w-4 h-4 rounded-full ${
                node.session.status === 'active' ? 'bg-green-400' : 'bg-blue-400'
              } animate-pulse`} />
            </div>
            
            {/* Globe icon */}
            <div className="flex items-center mb-3">
              <Globe className="w-6 h-6 text-blue-400 mr-2" />
              <span className="text-xs text-white/60 font-medium">
                Globe Session
              </span>
            </div>
            
            {/* Title */}
            <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
              {node.session.title}
            </h3>
            
            {/* Stats */}
            <div className="flex justify-between text-xs text-white/50">
              <span>{node.session.globeImages.length} images</span>
              <span>{node.session.chatHistory.length} chats</span>
            </div>
            
            {/* Last accessed */}
            <div className="text-xs text-white/40 mt-2">
              {node.session.lastAccessedAt ? 
                `Last: ${new Date(node.session.lastAccessedAt).toLocaleDateString()}` :
                'Never accessed'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LearningPage() {
  const { user, firebaseUserId } = useAuth0Firebase();
  const { sessions, loading: sessionsLoading, createNewSession: createSession, deleteSession } = useGlobeSessions();
  const [nodes, setNodes] = useState<ConstellationNode[]>([]);
  const [selectedSession, setSelectedSession] = useState<GlobeSession | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [settingsOpenNodeId, setSettingsOpenNodeId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    sessionId: string;
    sessionTitle: string;
  }>({ isOpen: false, sessionId: '', sessionTitle: '' });
  const [linkCopiedId, setLinkCopiedId] = useState<string | null>(null);
  
  // State for visual linking
  const [isLinking, setIsLinking] = useState(false);
  const [linkingFromNodeId, setLinkingFromNodeId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [linkingFromPosition, setLinkingFromPosition] = useState({ x: 0, y: 0 });
  
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<ConstellationNode[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Add keyboard event listener for ESC key to cancel linking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLinking) {
        console.log('ESC pressed, canceling link');
        setIsLinking(false);
        setLinkingFromNodeId(null);
        setLinkingFromPosition({ x: 0, y: 0 });
      }
    };

    if (isLinking) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLinking]);

  // Add global click listener to cancel linking mode
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!isLinking) return;
      
      // Check if the click is on a constellation node
      const target = e.target as HTMLElement;
      const isNodeClick = target.closest('[data-node-id]');
      
      if (!isNodeClick) {
        console.log('Global click outside nodes, canceling link');
        setIsLinking(false);
        setLinkingFromNodeId(null);
        setLinkingFromPosition({ x: 0, y: 0 });
      }
    };

    if (isLinking) {
      document.addEventListener('click', handleGlobalClick, true); // Use capture phase
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isLinking]);

  // Initialize constellation nodes when sessions are loaded
  useEffect(() => {
    if (sessions.length > 0) {
      const initialNodes: ConstellationNode[] = sessions.map((session, index) => ({
        id: session.id,
        session,
        position: {
          x: Math.random() * 800 + 100, // Random position within viewport
          y: Math.random() * 400 + 150,
        },
        isDragging: false,
      }));
      setNodes(initialNodes);
    } else {
      setNodes([]);
    }
  }, [sessions]);

  // Drag handlers - optimized for performance
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Close any open settings when starting to drag
    setSettingsOpenNodeId(null);

    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;

    setDragOffset({
      x: e.clientX - rect.left - node.position.x,
      y: e.clientY - rect.top - node.position.y,
    });

    setDraggingNodeId(nodeId);
    
    // Only update state for the dragging flag
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, isDragging: true } : n
    ));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Always update mouse position for linking mode
    if (isLinking) {
      // For fixed positioning, use clientX/Y directly since it's relative to viewport
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    }

    // Handle dragging if there's a dragging node
    if (!draggingNodeId) return;

    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    const constrainedX = Math.max(0, Math.min(newX, rect.width - 200));
    const constrainedY = Math.max(0, Math.min(newY, rect.height - 200));

    // Direct DOM manipulation for smooth dragging
    const nodeElement = document.querySelector(`[data-node-id="${draggingNodeId}"]`) as HTMLElement;
    if (nodeElement) {
      nodeElement.style.left = `${constrainedX}px`;
      nodeElement.style.top = `${constrainedY}px`;
      nodeElement.style.transform = 'scale(1.02)';
    }
  };

  const handleMouseUp = () => {
    if (!draggingNodeId) return;

    // Get final position from DOM and update state
    const nodeElement = document.querySelector(`[data-node-id="${draggingNodeId}"]`) as HTMLElement;
    if (nodeElement) {
      const finalX = parseFloat(nodeElement.style.left) || 0;
      const finalY = parseFloat(nodeElement.style.top) || 0;
      
      setNodes(prev => prev.map(n => 
        n.id === draggingNodeId 
          ? { ...n, position: { x: finalX, y: finalY }, isDragging: false }
          : n
      ));
    }

    setDraggingNodeId(null);
  };

  const createSessionWithTitle = async (title: string) => {
    try {
      const sessionId = await createSession(title);
      console.log('Created new session:', sessionId);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create session:', error);
      // You can add error handling UI here
    }
  };

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleToggleSettings = (nodeId: string) => {
    setSettingsOpenNodeId(prev => prev === nodeId ? null : nodeId);
  };

  const handleCreateLink = async (sessionId: string) => {
    // Find the node position to start the visual link from
    const node = nodes.find(n => n.id === sessionId);
    if (!node) return;

    // Get canvas position relative to viewport
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate the center position of the node in viewport coordinates
    const nodePosition = {
      x: rect.left + node.position.x + 100, // Canvas offset + node position + half node width
      y: rect.top + node.position.y + 100   // Canvas offset + node position + half node height
    };

    // Start visual linking mode
    setIsLinking(true);
    setLinkingFromNodeId(sessionId);
    setLinkingFromPosition(nodePosition);
    setMousePosition(nodePosition); // Initialize mouse position to node center
    setSettingsOpenNodeId(null); // Close settings when starting to link
  };

  const handleCompleteLink = (targetSessionId: string) => {
    if (!isLinking || !linkingFromNodeId || linkingFromNodeId === targetSessionId) return;
    
    // Here you could add logic to actually create a connection between sessions
    console.log(`Creating link from ${linkingFromNodeId} to ${targetSessionId}`);
    
    // Reset linking mode
    setIsLinking(false);
    setLinkingFromNodeId(null);
    setLinkingFromPosition({ x: 0, y: 0 });
  };

  const handleCancelLink = () => {
    setIsLinking(false);
    setLinkingFromNodeId(null);
    setLinkingFromPosition({ x: 0, y: 0 });
  };

  const handleDeleteSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setDeleteConfirmation({
        isOpen: true,
        sessionId,
        sessionTitle: session.title
      });
    }
  };

  const confirmDeleteSession = async () => {
    try {
      await deleteSession(deleteConfirmation.sessionId);
      // Remove from nodes state
      setNodes(prev => prev.filter(node => node.id !== deleteConfirmation.sessionId));
      // Close settings if this node had settings open
      setSettingsOpenNodeId(null);
      // Close confirmation modal
      setDeleteConfirmation({ isOpen: false, sessionId: '', sessionTitle: '' });
    } catch (error) {
      console.error('Failed to delete session:', error);
      // You can add error handling UI here
    }
  };

  const cancelDeleteSession = () => {
    setDeleteConfirmation({ isOpen: false, sessionId: '', sessionTitle: '' });
  };

  // Handle escape key for delete confirmation modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deleteConfirmation.isOpen) {
        cancelDeleteSession();
      }
    };

    if (deleteConfirmation.isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [deleteConfirmation.isOpen]);

  const handleCreateNewSession = async () => {
    try {
      // For now, create with a default title. You can replace this with a modal for user input
      const defaultTitle = `Globe Session ${new Date().toLocaleString()}`;
      const sessionId = await createSession(defaultTitle);
      console.log('Created new session:', sessionId);
      // The sessions will be automatically refreshed by the useGlobeSessions hook
    } catch (error) {
      console.error('Failed to create session:', error);
      // You can add error handling UI here
    }
  };

  const createNewSession = () => {
    setShowCreateModal(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar currentSection={0} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Please log in to explore</h1>
            <p className="text-white/70">You need to be authenticated to access your constellation.</p>
          </div>
        </div>
      </div>
    );
  }

  if (sessionsLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar currentSection={0} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Loading your constellation...</h1>
            <p className="text-white/70">Gathering your globe sessions from the stars.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black text-white overflow-hidden"
      onClick={(e) => {
        // Backup click handler for canceling linking mode
        if (isLinking && e.target === e.currentTarget) {
          console.log('Outer container clicked, canceling link');
          handleCancelLink();
        }
      }}
    >
      <Navbar currentSection={0} />
      
      {/* Constellation Canvas */}
      <div 
        ref={canvasRef}
        className="relative w-full h-screen pt-24"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          console.log('Canvas clicked', e.target, e.currentTarget, e.target === e.currentTarget);
          // Close settings when clicking on empty canvas
          if (e.target === e.currentTarget) {
            setSettingsOpenNodeId(null);
            // Cancel linking mode when clicking on empty space
            if (isLinking) {
              console.log('Canceling link from canvas click');
              handleCancelLink();
            }
          }
        }}
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(0, 163, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 26, 26, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(128, 0, 128, 0.05) 0%, transparent 70%),
            #000
          `,
          cursor: isLinking ? 'crosshair' : 'default'
        }}
      >
        {/* Starfield Background */}
        <div 
          className="absolute inset-0 overflow-hidden"
          onClick={(e) => {
            console.log('Starfield clicked');
            if (isLinking) {
              console.log('Canceling link from starfield click');
              setIsLinking(false);
              setLinkingFromNodeId(null);
              setLinkingFromPosition({ x: 0, y: 0 });
            }
            setSettingsOpenNodeId(null);
          }}
        >
          {Array.from({ length: 100 }).map((_, i) => (
            <Star
              key={i}
              className="absolute text-white/20"
              size={Math.random() * 4 + 1}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${Math.random() * 3 + 2}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-24 left-0 right-0 z-10 text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white [text-shadow:0_0_20px_#00a3ff]">
            {user?.displayName || user?.email?.split('@')[0] || 'Your'}'s Constellation
          </h1>
          <p className="text-white/60 mb-6">
            Drag your globe sessions around to organize your learning universe
          </p>
        </div>

        {/* Floating Add Button */}
        <Button 
          onClick={openCreateModal}
          className="absolute top-32 right-8 z-20 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Session
        </Button>

        {/* Constellation Nodes */}
        {nodes.map((node) => (
          <ConstellationNode
            key={node.id}
            node={node}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onClick={() => {
              if (isLinking && linkingFromNodeId !== node.id) {
                handleCompleteLink(node.id);
              } else {
                setSelectedSession(node.session);
              }
            }}
            onDelete={() => handleDeleteSession(node.id)}
            onCreateLink={() => handleCreateLink(node.id)}
            isSettingsOpen={settingsOpenNodeId === node.id}
            onToggleSettings={() => handleToggleSettings(node.id)}
            linkCopied={linkCopiedId === node.id}
            isLinking={isLinking}
            isLinkingFrom={linkingFromNodeId === node.id}
          />
        ))}

        {/* Empty State */}
        {sessions.length === 0 && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            onClick={(e) => {
              console.log('Empty state clicked');
              if (isLinking && e.target === e.currentTarget) {
                console.log('Canceling link from empty state click');
                setIsLinking(false);
                setLinkingFromNodeId(null);
                setLinkingFromPosition({ x: 0, y: 0 });
              }
              setSettingsOpenNodeId(null);
            }}
          >
            <div className="text-center max-w-md">
              <div className="mb-6">
                <Star className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Your constellation awaits</h2>
                <p className="text-white/60">
                  Create your first globe session to begin exploring the world and building your learning constellation.
                </p>
              </div>
              <Button 
                onClick={openCreateModal}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Session
              </Button>
            </div>
          </div>
        )}

        {/* Connection Lines between nodes */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {nodes.map((node, index) => 
            nodes.slice(index + 1).map((otherNode) => {
              const distance = Math.sqrt(
                Math.pow(node.position.x - otherNode.position.x, 2) + 
                Math.pow(node.position.y - otherNode.position.y, 2)
              );
              // Only draw lines between nearby nodes
              if (distance < 300) {
                return (
                  <line
                    key={`${node.id}-${otherNode.id}`}
                    x1={node.position.x + 100} // Center of node
                    y1={node.position.y + 50}
                    x2={otherNode.position.x + 100}
                    y2={otherNode.position.y + 50}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                    strokeDasharray="2,4"
                  />
                );
              }
              return null;
            })
          )}
        </svg>
      </div>

      {/* Visual Linking Thread */}
      {isLinking && (
        <svg className="fixed inset-0 pointer-events-none" style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Main linking line */}
          <line
            x1={linkingFromPosition.x}
            y1={linkingFromPosition.y}
            x2={mousePosition.x}
            y2={mousePosition.y}
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="3"
            filter="url(#glow)"
            className="animate-pulse"
          />
          {/* Sparkle effects along the line */}
          <circle
            cx={linkingFromPosition.x + (mousePosition.x - linkingFromPosition.x) * 0.3}
            cy={linkingFromPosition.y + (mousePosition.y - linkingFromPosition.y) * 0.3}
            r="2"
            fill="rgba(255, 255, 255, 0.8)"
            filter="url(#glow)"
            className="animate-ping"
          />
          <circle
            cx={linkingFromPosition.x + (mousePosition.x - linkingFromPosition.x) * 0.7}
            cy={linkingFromPosition.y + (mousePosition.y - linkingFromPosition.y) * 0.7}
            r="1.5"
            fill="rgba(255, 255, 255, 0.6)"
            filter="url(#glow)"
            className="animate-pulse"
          />
        </svg>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)} 
        />
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal 
          onClose={() => setShowCreateModal(false)}
          onCreateSession={createSessionWithTitle}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cancelDeleteSession();
            }
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-md border border-red-500/30 rounded-2xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-3">
                Delete Session
              </h3>
              
              {/* Warning Message */}
              <p className="text-white/70 mb-2">
                Are you sure you want to delete
              </p>
              <p className="text-white font-semibold mb-6 break-words">
                "{deleteConfirmation.sessionTitle}"?
              </p>
              
              <p className="text-red-400/80 text-sm mb-8">
                This action cannot be undone. All your globe images and chat history will be permanently lost.
              </p>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={cancelDeleteSession}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteSession}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  Delete Forever
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onSelect }: { session: GlobeSession; onSelect: () => void }) {
  return (
    <div 
      onClick={onSelect}
      className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:border-white/40 cursor-pointer transition-all duration-300 hover:bg-white/15"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-white">{session.title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          session.status === 'active' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        }`}>
          {session.status}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-white/70 text-sm">
          <span>📍 {session.globeImages.length} locations explored</span>
        </div>
        <div className="flex items-center text-white/70 text-sm">
          <span>💬 {session.chatHistory.length} AI conversations</span>
        </div>
        <div className="flex items-center text-white/70 text-sm">
          <span>🕒 Last accessed: {session.lastAccessedAt.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Preview of latest globe image */}
      {session.globeImages.length > 0 && (
        <div className="mb-4">
          <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center text-white/50">
            Globe View Preview
            <br />
            <span className="text-xs">{session.globeImages[session.globeImages.length - 1].locationName}</span>
          </div>
        </div>
      )}

      <Button 
        className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        Continue Exploring
      </Button>
    </div>
  );
}

function SessionDetailModal({ session, onClose }: { session: GlobeSession; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-white/20 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{session.title}</h2>
          <Button 
            onClick={onClose}
            variant="outline" 
            className="border-white/30 text-white hover:bg-white/20"
          >
            Close
          </Button>
        </div>
        
        <div className="grid md:grid-cols-2 h-[70vh]">
          {/* Globe Images */}
          <div className="p-6 border-r border-white/20 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Globe Exploration</h3>
            <div className="space-y-4">
              {session.globeImages.map((image) => (
                <div key={image.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="w-full h-40 bg-gray-800 rounded-lg mb-3 flex items-center justify-center text-white/50">
                    Globe Screenshot
                    <br />
                    {image.locationName}
                  </div>
                  <div className="text-white/80 text-sm">
                    <p className="font-medium">{image.locationName}</p>
                    <p className="text-white/60">
                      {image.location.lat.toFixed(4)}, {image.location.lng.toFixed(4)}
                    </p>
                    {image.userNote && (
                      <p className="text-white/70 mt-2 italic">"{image.userNote}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat History */}
          <div className="p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">AI Conversation</h3>
            <div className="space-y-3">
              {session.chatHistory.map((chat) => (
                <div key={chat.id} className={`p-3 rounded-lg ${
                  chat.role === 'user' 
                    ? 'bg-blue-500/20 ml-8 text-blue-100' 
                    : 'bg-white/10 mr-8 text-white'
                }`}>
                  <div className="text-sm font-medium mb-1">
                    {chat.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div className="text-sm">{chat.message}</div>
                  <div className="text-xs text-white/50 mt-2">
                    {chat.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateSessionModal({ 
  onClose, 
  onCreateSession 
}: { 
  onClose: () => void;
  onCreateSession: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Start New Globe Session</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Session Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim() && !isCreating) {
                    e.preventDefault();
                    document.querySelector<HTMLButtonElement>('[data-create-button]')?.click();
                  }
                }}
                placeholder="e.g., Exploring Southeast Asia"
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-white/60"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={onClose}
                variant="outline" 
                className="flex-1 border-white/30 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button 
                disabled={!title.trim() || isCreating}
                className="flex-1 bg-white text-black hover:bg-white/90"
                data-create-button
                onClick={async () => {
                  if (!title.trim()) return;
                  
                  setIsCreating(true);
                  try {
                    await onCreateSession(title.trim());
                  } catch (error) {
                    console.error('Failed to create session:', error);
                    // The error handling is done in the parent component
                  } finally {
                    setIsCreating(false);
                  }
                }}
              >
                {isCreating ? 'Creating...' : 'Start Exploring'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}