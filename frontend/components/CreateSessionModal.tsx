'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface CreateSessionModalProps {
  onClose: () => void;
  onCreateSession: (title: string) => Promise<void>;
}

export function CreateSessionModal({ onClose, onCreateSession }: CreateSessionModalProps) {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a session title');
      return;
    }

    try {
      setIsCreating(true);
      await onCreateSession(title.trim());
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Create New Session</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isCreating}
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="sessionTitle" className="block text-sm font-medium text-white/80 mb-2">
              Session Title
            </label>
            <input
              id="sessionTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your learning session..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isCreating}
              autoFocus
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white/70 hover:bg-white/10"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isCreating || !title.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Session'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}