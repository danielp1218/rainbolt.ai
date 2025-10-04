# 🎮 Enhanced Database Schema for Multiplayer Games & Chat

## 📊 New Database Collections

### 1. **Game Instances** (`gameInstances`)
Stored game sessions with persistent chat and player history:

```typescript
{
  id: "game_123",
  hostUserId: "auth0|user123",
  status: "waiting",            // waiting | active | completed | abandoned
  players: [
    {
      userId: "auth0|user123",
      displayName: "Player 1",
      isReady: true,
      currentScore: 15000,
      hasSubmittedGuess: false
    }
  ],
  settings: {
    maxPlayers: 4,
    rounds: 5,
    timeLimit: 120,             // seconds per round
    allowChat: true,
    publicGame: true            // visible in public games list
  },
  currentRound: 1,
  currentLocation: {
    lat: 40.7128,
    lng: -74.0060
  },
  createdAt: "2025-10-04T...",
  updatedAt: "2025-10-04T..."
}
```

### 2. **Chat Messages** (`chatMessages`)
Real-time chat for game instances:

```typescript
{
  id: "msg_123",
  gameInstanceId: "game_123",
  userId: "auth0|user123",
  displayName: "Player 1",
  message: "Great guess!",
  messageType: "chat",          // chat | system | guess_hint | reaction
  timestamp: "2025-10-04T...",
  metadata: {
    guessDistance: 1250,        // for guess hints
    systemEvent: "player_joined" // for system messages
  }
}
```

### 3. **Live Game Guesses** (`liveGameGuesses`)
Individual guesses per round per player:

```typescript
{
  id: "guess_123",
  gameInstanceId: "game_123",
  userId: "auth0|user123", 
  round: 1,
  guessedLocation: { lat: 40.7128, lng: -74.0060 },
  actualLocation: { lat: 40.7589, lng: -73.9851 },
  distance: 1250,              // km
  points: 8500,
  timeSpent: 87,               // seconds
  submittedAt: "2025-10-04T..."
}
```

## 🔧 New Database Functions

### **Game Management**
- `createGameInstance()` - Create new game session (returns game ID)
- `joinGameInstance()` - Join game by ID
- `getGameInstance()` - Get specific game details
- `getAllGames()` - Browse all games with optional status filter
- `getPublicGames()` - Get public games available to join
- `startGameInstance()` - Start game (host only)
- `submitLiveGameGuess()` - Submit guess for current round

### **Chat System**
- `sendChatMessage()` - Send chat message
- `getChatHistory()` - Get persistent chat history
- `sendSystemMessage()` - Send system notifications

### **User Game Management**
- `getUserActiveGames()` - Get user's current games
- `updatePlayerReadyStatus()` - Toggle ready state

## 🎯 React Hooks Created

### **`useGameInstance(gameId?)`**
Complete game state management:
```typescript
const { 
  gameInstance,     // Current game state
  createGame,       // Create new game
  joinGame,         // Join by game ID
  setReady,         // Toggle ready status
  startGame,        // Start game (host)
  submitGuess       // Submit round guess
} = useGameInstance();
```

### **`useAllGames()`**
Browse and manage all games:
```typescript
const {
  allGames,         // All games (with filter)
  publicGames,      // Public games available to join
  loadAllGames,     // Load with status filter
  loadPublicGames,  // Refresh public games
  refreshGames      // Refresh all
} = useAllGames();
```

### **`useGameChat(gameId)`**
Real-time chat functionality:
```typescript
const {
  messages,         // Chat history
  sendMessage,      // Send chat message
  sendReaction      // Send emoji/reaction
} = useGameChat(gameInstanceId);
```

### **`useUserGames()`**
User's active games:
```typescript
const {
  activeGames,      // User's current games
  refreshGames      // Reload games list
} = useUserGames();
```

## 🎮 Ready-to-Use Components

### **Game Management**
- `<CreateGameModal />` - Full game setup UI
- `<BrowseGamesModal />` - Browse and join public games UI
- `<ActiveGamesList />` - Show user's games

### **Live Chat**
- `<GameChat gameId={gameId} />` - Complete chat interface with persistence

### **Games Page**
- `/app/games/page.tsx` - Complete games management page with:
  - **My Games tab** - User's active games
  - **Public Games tab** - Joinable public games
  - **All Games tab** - Browse all games with filters
  - **Game details sidebar** - Selected game info and chat

## 📱 Example Usage

### **Navigate to Games Page**
```typescript
// The games page is available at /games
// Features:
// - Create new games
// - Browse public games
// - View all games with status filters
// - Live chat for each game
// - Game details and player management
```

### **Using in Components**
```typescript
function GameLobby() {
  const [gameId, setGameId] = useState<string | null>(null);
  
  const handleGameCreated = (newGameId: string) => {
    setGameId(newGameId);
    // Navigate to game or show game details
  };
  
  return (
    <div>
      <CreateGameModal onGameCreated={handleGameCreated} />
      <BrowseGamesModal onGameJoined={setGameId} />
      {gameId && <GameChat gameInstanceId={gameId} />}
    </div>
  );
}
```

### **Join & Play**
```typescript
function GamePage() {
  const { user } = useUser();
  const { gameInstance, submitGuess } = useGameInstance(gameId);
  
  const handleGuessSubmit = async (location: {lat: number, lng: number}) => {
    const distance = calculateDistance(location, actualLocation);
    const points = calculatePoints(distance);
    
    await submitGuess(
      gameInstance.currentRound,
      location,
      actualLocation,
      distance,
      points,
      timeSpent
    );
  };
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Game area */}
      <div className="col-span-2">
        <GeoGuesserMap onGuessSubmit={handleGuessSubmit} />
      </div>
      
      {/* Chat sidebar */}
      <div>
        <GameChat gameInstanceId={gameId} />
      </div>
    </div>
  );
}
```

## 🔄 Game Flow

### **1. Game Creation**
1. User creates game with settings (public/private, difficulty, etc.)
2. Game stored in database with unique ID
3. System message: "Game created! Waiting for players..."

### **2. Game Discovery & Joining**
1. Users browse public games in `/games` page
2. Players join games by clicking "Join" button
3. System message: "Player X joined the game"
4. Players mark themselves as ready

### **3. Game Start**
1. Host starts when all players ready
2. System message: "Game started! Round 1 begins now."
3. Location revealed to all players

### **4. Round Play**
1. Players make guesses
2. Chat shows guess hints: "Player X guessed 1.2km away for 8500 points!"
3. Round ends when all submit or time expires

### **5. Game Completion & Persistence**
1. Final scores calculated
2. Game moves to "completed" status
3. **Chat history preserved permanently**
4. **Game session stored for future reference**
5. Results saved to user stats

## 🚀 Next Steps

1. **Set up Firestore Database** (5 minutes)
2. **Navigate to `/games` page** to test the interface
3. **Create and join games** using the UI
4. **Test persistent chat** functionality
5. **Integrate with your 3D globe** for location selection
6. **Add real-time listeners** for live updates during games

Your database now supports **full multiplayer functionality** with persistent chat, stored game sessions, and comprehensive game management! 🌍✨