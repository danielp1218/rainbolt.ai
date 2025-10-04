This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Rainbolt.ai Frontend

A stunning landing page with 3D globe visualization and AI-powered chat interface.

## Features

- **Interactive 3D Globe** - React Three Fiber powered Earth visualization
- **Landing Page** - Multi-section scrolling experience with animations
- **Floating Chat** - FAB-triggered chat overlay on landing page
- **Dedicated Chat Page** - Full-screen chat experience with centered globe

## Pages

### 🏠 Landing Page (`/`)
- Hero section with animated 3D globe
- Multiple content sections (Features, About, Team, Contact)
- Floating chat launcher (bottom-right FAB)
- Responsive design

### 💬 Chat Page (`/chat`)
- **NEW**: Dedicated full-screen chat interface
- Globe centered on left side
- Fixed chat panel on right (420px, darker background)
- Cannot be closed (permanent chat interface)
- Desktop-only experience
- Perfect for extended conversations

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Routes
- `/` - Landing page with floating chat
- `/chat` - Dedicated chat page with fixed right panel

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx              # Landing page
│   ├── chat/
│   │   ├── page.tsx         # Dedicated chat page
│   │   └── README.md        # Chat page documentation
│   └── api/
│       └── chat/
│           └── route.ts      # Mock chat API endpoint
├── components/
│   ├── ChatLauncher.tsx      # FAB button for landing page
│   ├── ChatPanel.tsx         # Floating chat panel (landing)
│   ├── ChatHeader.tsx        # Chat header with controls
│   ├── ChatHistory.tsx       # Message list with scroll
│   ├── ChatMessage.tsx       # Individual message bubble
│   ├── ChatComposer.tsx      # Message input area
│   ├── useChatStore.ts       # Zustand state management
│   └── ui/
│       ├── globe.tsx         # 3D Earth component
│       ├── navbar.tsx        # Navigation bar
│       └── button.tsx        # Button component
├── lib/
│   └── chatMock.ts           # Mock API function
└── utils/
    ├── coordinates.ts        # Globe coordinate helpers
    └── getStarfield.ts       # Starfield generation
```

## 🎨 Key Technologies

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **Three.js** - 3D globe visualization
- **React Three Fiber** - React renderer for Three.js
- **Radix UI** - Accessible UI primitives
- **Framer Motion** - Smooth animations
- **Zustand** - Lightweight state management
- **TailwindCSS 4** - Utility-first styling
- **TypeScript** - Type safety

## 📚 Documentation

- [Chat Implementation Guide](./CHAT_IMPLEMENTATION.md) - Complete chat system overview
- [Quick Start Guide](./QUICK_START.md) - Testing and customization
- [Chat Page Documentation](./app/chat/README.md) - Dedicated chat page details

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
