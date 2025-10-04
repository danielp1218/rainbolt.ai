# Rainbolt.ai Chat Interface - Quick Start Guide

## 🚀 Getting Started

Your chat interface is now live and running!

### Access the App
```
http://localhost:3000
```

## 💬 Features to Test

### 1. Open the Chat
- Look for the **blue circular button** with a message icon in the bottom-right corner
- Click it to open the chat panel

### 2. Send a Message
- Type anything in the input field at the bottom
- Press **Enter** to send (or click the Send button)
- Watch your message appear immediately
- See the typing indicator (three pulsing dots)
- After ~700ms, receive "hello world" response

### 3. Try These Features

#### Desktop View
- **Copy Message**: Hover over any message → click copy icon
- **More Options**: Click three-dot menu in header → "Clear conversation"
- **Minimize**: Click minimize button to close panel
- **Close**: Click X button or press ESC key
- **Scroll**: Scroll up in history → "Jump to bottom" button appears

#### Mobile View
- Resize browser to mobile size (< 768px width)
- Chat opens as bottom sheet
- Drag handle at top
- Full touch support

#### Keyboard Navigation
- `Tab` - Move between controls
- `Enter` - Send message
- `Shift + Enter` - New line
- `Esc` - Close chat

### 4. Accessibility
- Use screen reader to test ARIA labels
- Navigate with keyboard only
- Check focus indicators

## 🎨 Visual Highlights

### Design Elements
✨ **Glassmorphism** - Frosted glass effect on panel  
🌊 **Smooth Animations** - Springy motions throughout  
💙 **Blue Accent** - Modern, clean color scheme  
🌐 **Globe Integration** - Perfectly layered overlay  
📱 **Responsive** - Works on all screen sizes  

### States to Observe
1. **Empty State** - First open, helpful prompt shown
2. **Typing State** - Three pulsing dots animation
3. **Message State** - Bubbles slide in from below
4. **Scroll State** - Automatic scroll to latest
5. **Hover State** - Copy button appears

## 🔧 Customization Quick Reference

### Change Accent Color
Find and replace `bg-blue-500` with your brand color in:
- `ChatLauncher.tsx` (FAB button)
- `ChatComposer.tsx` (Send button)
- `ChatHistory.tsx` (Scroll-to-bottom button)
- `ChatMessage.tsx` (User message bubbles)

### Adjust Panel Size
In `ChatPanel.tsx`:
```typescript
// Desktop
max-w-[420px]  // Width
h-[75vh]       // Height

// Mobile
maxHeight: '85vh'
```

### Change Response Time
In `lib/chatMock.ts`:
```typescript
const delay = 600 + Math.random() * 300; // 600-900ms
```

## 📱 Component Architecture

```
ChatLauncher (FAB)
    ↓ (opens)
ChatPanel (Container)
    ├── ChatHeader (Title, Controls)
    ├── ChatHistory (Messages)
    │   └── ChatMessage (Individual)
    └── ChatComposer (Input, Send)
```

## 🎯 State Flow

```
User types → ChatComposer
    ↓
Press Enter → useChatStore.send()
    ↓
User message added → ChatHistory updates
    ↓
Mock API called (700ms delay)
    ↓
Assistant message added → ChatHistory updates
    ↓
Auto-scroll to bottom
```

## 🛠️ Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📦 Dependencies Added

- `@radix-ui/react-dialog` - Mobile bottom sheet
- `@radix-ui/react-scroll-area` - Smooth scrolling
- `@radix-ui/react-tooltip` - Hover tooltips
- `@radix-ui/react-visually-hidden` - Accessibility
- `framer-motion` - Smooth animations
- `zustand` - State management

## 🐛 Common Issues & Solutions

### Chat button not visible
→ Check z-index conflicts, ensure no CSS overriding z-[100]

### Animations laggy
→ Enable GPU acceleration, check for CSS will-change properties

### Mobile keyboard covers input
→ Safe area insets should handle this, check mobile viewport meta tag

### Messages not auto-scrolling
→ Verify ScrollArea ref is connected in ChatHistory.tsx

## 🎉 Next Steps

1. **Test thoroughly** - Try all features on different devices
2. **Customize styling** - Match your brand colors
3. **Connect real API** - Replace mock with actual LLM backend
4. **Add features** - Consider file uploads, code blocks, etc.
5. **Deploy** - Push to production when ready!

## 📞 Need Help?

Check the full implementation guide in `CHAT_IMPLEMENTATION.md`

---

**Enjoy your new chat interface! 🚀**
