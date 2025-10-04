# Visual Layout Comparison

## Landing Page Layout (/)

```
┌─────────────────────────────────────────────────────┐
│  Navbar                                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│         🌐 Globe (Full Background)                  │
│                                                     │
│     Hero Content                                    │
│     "Learn to Explore"                              │
│                                                     │
│                                                     │
│                                                     │
│                                            ┌────┐   │
│                                            │ 💬 │   │ ← FAB Button
│                                            └────┘   │
└─────────────────────────────────────────────────────┘

When FAB is clicked → Floating panel appears:

┌─────────────────────────────────────────────────────┐
│                                                     │
│         🌐 Globe (Full Background)              ┌───┴───────┐
│                                                 │   Chat    │
│                                                 │   Panel   │
│                                                 │           │
│                                                 │  Header   │
│                                                 │ --------- │
│                                                 │ Messages  │
│                                                 │           │
│                                                 │ --------- │
│                                                 │  [Input]  │
└─────────────────────────────────────────────────┴───────────┘
                                                  420px width
```

## Chat Page Layout (/chat)

```
┌──────────────────────────────────────┬────────────────────┐
│                                      │  Chat Header       │
│                                      │  • Rainbolt AI     │
│                                      ├────────────────────┤
│                                      │                    │
│                                      │                    │
│           🌐 Globe                   │   Chat History     │
│         (Centered)                   │                    │
│                                      │   • Message 1      │
│                                      │   • Message 2      │
│     ↻ Rotatable                      │   • Message 3      │
│                                      │                    │
│                                      │   [Scroll Area]    │
│                                      │                    │
│                                      │                    │
│                                      ├────────────────────┤
│                                      │  Message Input     │
│                                      │  [Type here...]    │
└──────────────────────────────────────┴────────────────────┘
        Flexible width                      420px fixed

Background: Black
Globe Area: Gradient to chat
Chat Panel: bg-black/95 (Very Dark)
```

## Side-by-Side Comparison

### Landing Page (/)
- **Layout**: Full-screen globe background
- **Chat**: Optional (click FAB to open)
- **Chat Position**: Floating bottom-right
- **Chat Size**: 420px × 75vh (max)
- **Chat Background**: Semi-transparent glass (`bg-white/10`)
- **Closeable**: Yes (X button, ESC, minimize)
- **Mobile**: Bottom sheet
- **Use Case**: Quick interactions while browsing

### Chat Page (/chat)
- **Layout**: Split view (globe left, chat right)
- **Chat**: Always visible (permanent)
- **Chat Position**: Fixed right edge
- **Chat Size**: 420px × 100vh
- **Chat Background**: Nearly opaque (`bg-black/95`)
- **Closeable**: No (permanent fixture)
- **Mobile**: Desktop only warning
- **Use Case**: Extended conversations

## Color Comparison

### Landing Page Chat Panel
```css
background: rgba(255, 255, 255, 0.1)  /* Very transparent */
backdrop-filter: blur(12px)
border: rgba(255, 255, 255, 0.1)      /* Subtle border */
```

### Chat Page Panel
```css
background: rgba(0, 0, 0, 0.95)       /* Nearly opaque */
border: rgba(255, 255, 255, 0.2)      /* Stronger border */
shadow: 0 25px 50px rgba(0, 0, 0, 0.5) /* Deep shadow */
```

## Responsive Breakpoints

### Landing Page
| Screen Size | Behavior |
|-------------|----------|
| Desktop (>768px) | Floating panel (420px) |
| Mobile (<768px) | Bottom sheet (full width) |
| Tablet | Bottom sheet |

### Chat Page
| Screen Size | Behavior |
|-------------|----------|
| Desktop (>768px) | Split view (working) |
| Mobile (<768px) | "Desktop Only" message |
| Tablet | "Desktop Only" message |

## Globe Positioning

### Landing Page
```
Position: fixed inset-0 z-0
Size: Full viewport
Camera: Standard view
Controls: Full orbit enabled
```

### Chat Page
```
Position: absolute inset-0 right-[420px]
Size: Viewport minus chat panel width
Camera: Standard view
Controls: Full orbit enabled (within container)
Gradient: Smooth fade to chat area
```

## User Flow

### Landing Page Flow
```
1. User visits "/"
2. Sees globe + content
3. Notices blue FAB button
4. Clicks FAB
5. Chat panel slides in
6. User chats
7. User closes (X or ESC)
8. FAB reappears
```

### Chat Page Flow
```
1. User visits "/" or clicks "Try Chat Interface"
2. Navigates to "/chat"
3. Immediately sees:
   - Globe (left, centered)
   - Chat panel (right, fixed)
4. Starts chatting
5. Globe continues rotating
6. No way to close chat
7. Use browser back to return home
```

## Z-Index Layering

### Landing Page
```
z-0   : Globe background
z-10  : Content sections
z-60  : Hero content
z-100 : Chat overlay (pointer-events-none)
  └─ z-50: Chat panel (pointer-events-auto)
```

### Chat Page
```
z-0   : Globe container (left side)
Default: Chat panel (right side)
z-50  : Mobile warning overlay
```

## Performance Characteristics

### Landing Page
- Globe: Renders continuously
- Chat: Mounts/unmounts on open/close
- Animation: Panel slide + fade
- Memory: Chat state persists in Zustand

### Chat Page
- Globe: Renders continuously
- Chat: Always mounted
- Animation: None (static layout)
- Memory: Shared Zustand state

## When to Use Each

### Use Landing Page (/)
- ✅ First-time visitors
- ✅ Marketing/information browsing
- ✅ Quick questions
- ✅ Mobile users
- ✅ Casual exploration

### Use Chat Page (/chat)
- ✅ Extended conversations
- ✅ Desktop users only
- ✅ Focus on chat interaction
- ✅ Research/deep questions
- ✅ Watching globe while chatting

---

**Both pages share the same chat state via Zustand, so conversations persist!**
