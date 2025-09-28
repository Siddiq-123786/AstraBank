# Astra Nova Currency Platform Design Guidelines

## Design Approach: Reference-Based (Fintech + Educational)
**Inspiration**: Venmo's social payments + Robinhood's investment interface + Discord's friend system
**Rationale**: Young users expect familiar social finance patterns with gamified educational elements

## Core Design Elements

### Color Palette
**Primary**: 240 85% 20% (Deep space blue - representing "Astra Nova")
**Secondary**: 240 75% 35% (Lighter space blue)
**Accent**: 45 90% 60% (Warm gold - representing "Astras" currency)
**Success**: 142 70% 45% (Investment green)
**Background Dark**: 240 15% 8%
**Background Light**: 240 5% 98%
**Text**: 240 8% 95% (dark mode) / 240 15% 15% (light mode)

### Typography
**Primary**: Inter (clean, modern readability)
**Secondary**: JetBrains Mono (for currency amounts and transaction IDs)
Font sizes: text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

### Layout System
**Spacing Units**: 2, 4, 6, 8, 12, 16 (Tailwind classes: p-2, m-4, gap-6, etc.)
**Grid**: 12-column responsive grid with 4-unit gutters
**Max Width**: max-w-6xl for main content areas

### Component Library

**Navigation**
- Top navigation bar with Astra Nova logo, balance display, and profile dropdown
- Mobile: Bottom tab navigation (Wallet, Friends, Invest, Profile)

**Core Components**
- Currency display cards with Astra symbol (⭐) and animated balance updates
- Friend cards showing profile pictures (Gmail avatars), names, and quick-send buttons
- Transaction history list with icons, amounts, and timestamps
- Company investment cards with progress bars and ROI indicators
- Modal overlays for transactions and company creation
- Toast notifications for successful actions

**Forms**
- Rounded input fields with subtle borders
- Primary CTAs use accent gold color
- Secondary buttons use outline style with blurred backgrounds when over images

**Data Displays**
- Portfolio overview with donut charts showing investment distribution
- Transaction timeline with clear visual hierarchy
- Company listings in card grid format

### Key Interface Sections

**Dashboard**
- Balance prominently displayed at top
- Recent transactions feed
- Quick actions: Send Astras, Add Friend, Browse Companies

**Wallet**
- Current balance with send/receive buttons
- Transaction history with search/filter
- Pending transactions section

**Friends**
- Search by Gmail to add friends
- Friend list with quick-send options
- Recent interactions

**Investment Hub**
- Company discovery feed
- Portfolio overview
- Investment history and performance

**Company Creation**
- Multi-step form for groups to register businesses
- Team member invitation system
- Company profile setup

### Visual Hierarchy
- Use 8-unit spacing between major sections
- 4-unit spacing for related elements
- 2-unit spacing for tight groupings
- Emphasize currency amounts with larger typography and gold coloring
- Use subtle shadows and borders for card separation

### Animations
- Minimal, purposeful animations only
- Balance updates with gentle number roll animation
- Transaction success with subtle celebration effect
- Page transitions with simple fade

## Images
**Profile Pictures**: Gmail avatar integration for all users
**Company Logos**: User-uploaded company branding (square format, 128x128px)
**Placeholder States**: Simple illustrated graphics for empty states (no transactions, no friends, etc.)
**No Hero Image**: Dashboard-focused design without large marketing imagery

This platform prioritizes functionality and trust while maintaining the engaging social elements that make peer-to-peer finance platforms successful among young users.