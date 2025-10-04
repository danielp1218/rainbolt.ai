'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/ui/navbar';
import { GlobeSession } from '@/lib/globe-database';
import { Plus, Star, Globe } from 'lucide-react';

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
}> = ({ node, onMouseDown, onClick }) => {
  return (
    <div
      data-node-id={node.id}
      className={`absolute select-none ${
        node.isDragging ? 'z-50' : 'z-10'
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: node.isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: node.isDragging ? 'none' : 'transform 0.1s ease-out',
      }}
    >
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-xl blur-md group-hover:blur-lg transition-all duration-300" />
        
        {/* Main card container */}
        <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl w-48 overflow-hidden">
          {/* Draggable Handle Bar */}
          <div 
            className="bg-gradient-to-r from-blue-500/40 to-purple-500/40 border-b border-white/10 p-2 cursor-move hover:from-blue-500/60 hover:to-purple-500/60 transition-colors duration-100"
            onMouseDown={onMouseDown}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
              </div>
              <span className="text-xs text-white/70 font-medium">DRAG</span>
            </div>
          </div>

          {/* Clickable content area */}
          <div 
            className="p-4 cursor-pointer hover:bg-white/5 transition-colors duration-100"
            onClick={onClick}
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

export default function ConstellationPage() {
  const { user } = useUser();
  const [nodes, setNodes] = useState<ConstellationNode[]>([]);
  const [selectedSession, setSelectedSession] = useState<GlobeSession | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<ConstellationNode[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Mock sessions for development
  const mockSessions: GlobeSession[] = [
    {
      id: 'session_1',
      userId: user?.id || 'dev_user',
      title: 'Exploring European Capitals',
      status: 'active',
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 1800000),
      lastAccessedAt: new Date(Date.now() - 900000),
      globeImages: [
        {
          id: 'img_1',
          imageUrl: '/globe-screenshots/paris.jpg',
          location: { lat: 48.8566, lng: 2.3522 },
          locationName: 'Paris, France',
          timestamp: new Date(Date.now() - 1800000),
          userNote: 'Beautiful view of the Eiffel Tower area'
        },
        {
          id: 'img_2',
          imageUrl: '/globe-screenshots/rome.jpg',
          location: { lat: 41.9028, lng: 12.4964 },
          locationName: 'Rome, Italy',
          timestamp: new Date(Date.now() - 1200000),
          userNote: 'Colosseum region exploration'
        }
      ],
      chatHistory: [
        {
          id: 'chat_1',
          role: 'ai',
          message: 'Welcome! I see you\'re exploring European capitals. Would you like to learn about the history of Paris?',
          timestamp: new Date(Date.now() - 1700000),
          relatedImage: 'img_1'
        },
        {
          id: 'chat_2',
          role: 'user',
          message: 'Yes, tell me about the Eiffel Tower',
          timestamp: new Date(Date.now() - 1600000),
          relatedImage: 'img_1'
        },
        {
          id: 'chat_3',
          role: 'ai',
          message: 'The Eiffel Tower was built in 1889 for the Paris Exposition. It\'s 330 meters tall and was initially planned to be temporary!',
          timestamp: new Date(Date.now() - 1500000),
          relatedImage: 'img_1'
        }
      ]
    },
    {
      id: 'session_2',
      userId: user?.id || 'dev_user',
      title: 'Asian Megacities Tour',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 7200000),
      lastAccessedAt: new Date(Date.now() - 7200000),
      globeImages: [
        {
          id: 'img_3',
          imageUrl: '/globe-screenshots/tokyo.jpg',
          location: { lat: 35.6762, lng: 139.6503 },
          locationName: 'Tokyo, Japan',
          timestamp: new Date(Date.now() - 82800000),
        }
      ],
      chatHistory: [
        {
          id: 'chat_4',
          role: 'ai',
          message: 'Tokyo is the world\'s largest metropolitan area! What would you like to explore?',
          timestamp: new Date(Date.now() - 82800000),
          relatedImage: 'img_3'
        }
      ]
    }
  ];

  // Initialize constellation nodes on component mount
  useEffect(() => {
    if (mockSessions.length > 0) {
      const initialNodes: ConstellationNode[] = mockSessions.map((session, index) => ({
        id: session.id,
        session,
        position: {
          x: Math.random() * 800 + 100, // Random position within viewport
          y: Math.random() * 400 + 150,
        },
        isDragging: false,
      }));
      setNodes(initialNodes);
    }
  }, []);

  // Drag handlers - optimized for performance
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

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
    if (!draggingNodeId) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

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

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Navbar currentSection={0} />
      
      {/* Constellation Canvas */}
      <div 
        ref={canvasRef}
        className="relative w-full h-screen pt-24"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(0, 163, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 26, 26, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(128, 0, 128, 0.05) 0%, transparent 70%),
            #000
          `,
        }}
      >
        {/* Starfield Background */}
        <div className="absolute inset-0 overflow-hidden">
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
          onClick={createNewSession}
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
            onClick={() => setSelectedSession(node.session)}
          />
        ))}

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

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)} 
        />
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal onClose={() => setShowCreateModal(false)} />
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

function CreateSessionModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');

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
                placeholder="e.g., Exploring Southeast Asia"
                className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-white/60"
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
                disabled={!title.trim()}
                className="flex-1 bg-white text-black hover:bg-white/90"
                onClick={() => {
                  // Here you would create the session
                  console.log('Creating session:', title);
                  onClose();
                }}
              >
                Start Exploring
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}