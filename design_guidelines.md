# Astra Trader Design Guidelines

## Design Approach: Reference-Based (Space-themed Fintech + Educational)
**Inspiration**: Robinhood's clean investment interface + Duolingo's gamified learning + Discord's friend system, enhanced with cosmic/space exploration aesthetics
**Rationale**: Creates an engaging, futuristic financial education experience that makes learning approachable through space themes

## Core Design Elements

### Color Palette
**Primary**: 240 90% 15% (Deep cosmic navy - representing deep space)
**Secondary**: 260 85% 25% (Nebula purple for depth)
**Accent**: 45 95% 65% (Stellar gold - representing "Astras" and achievements)
**Success**: 180 70% 50% (Cyan stellar energy)
**Warning**: 30 85% 55% (Mars orange for alerts)
**Background Dark**: 240 20% 6% (Deep space black)
**Background Light**: 240 8% 97% (Starlight white)
**Text**: 240 10% 92% (dark mode) / 240 20% 12% (light mode)

### Typography
**Primary**: Inter (modern, space-age readability)
**Secondary**: JetBrains Mono (for currency amounts, coordinates, transaction IDs)
**Accent**: Orbitron via Google Fonts (for headers and cosmic branding)
Font sizes: text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

### Layout System
**Spacing Units**: 2, 4, 6, 8, 12, 16 (Tailwind classes: p-2, m-4, gap-6, etc.)
**Grid**: 12-column responsive grid with 6-unit gutters for spacious, cosmic feel
**Max Width**: max-w-7xl for immersive space exploration experience
**Border Radius**: Rounded corners throughout (rounded-lg, rounded-xl) for futuristic aesthetic

### Component Library

**Navigation**
- Cosmic top navigation with Astra Trader logo, balance display showing Astra currency (⭐), and profile dropdown
- Mobile: Bottom navigation with space-themed icons (Cockpit/Dashboard, Crew/Friends, Missions/Invest, Profile)
- Subtle glow effects on active navigation items

**Core Components**
- **Astra Mascot**: Friendly space character integrated throughout interface for guidance and celebrations
- **Currency Cards**: Floating panel design with subtle star field backgrounds and animated balance updates
- **Friend/Crew Cards**: Astronaut-themed profile displays with Gmail avatars in space helmet frames
- **Mission Cards**: Company investments styled as space exploration missions with progress indicators
- **Transaction Timeline**: Space mission log format with timestamps and stellar achievement badges
- **Modal Overlays**: Cosmic-themed with subtle aurora backgrounds and rounded edges
- **Achievement Notifications**: Constellation-style toast notifications for milestones

**Admin Controls**
- **Mission Control Dashboard**: Administrative overview with cosmic command center aesthetic
- **Student Fleet Management**: Organized crew/class management with space squadron themes
- **Mission Creation Tools**: Company/investment setup with space exploration mission planning interface

**Forms**
- Rounded input fields with subtle stellar glow on focus
- Primary buttons use stellar gold with gentle hover animations
- Secondary buttons use outline style with blurred backgrounds when over cosmic imagery
- Form sections organized as "mission briefings"

**Data Displays**
- **Portfolio Observatory**: Investment overview with constellation-style connection lines
- **Mission Progress**: Company performance with rocket trajectory visualizations
- **Learning Pathways**: Educational content organized as cosmic exploration routes

### Visual Hierarchy
- 12-unit spacing between major cosmic sections
- 6-unit spacing for related mission elements
- 4-unit spacing for tight crew groupings
- Emphasize Astra currency with stellar gold and larger Orbitron typography
- Use subtle cosmic shadows and aurora-inspired borders for depth

### Animations
- **Minimal Cosmic Effects**: Subtle star twinkle on currency updates
- **Achievement Celebrations**: Gentle constellation formation on mission completion
- **Page Transitions**: Smooth hyperspace-style fades
- **Loading States**: Gentle orbital rotation for loading indicators

### Images
**Profile Pictures**: Gmail avatars within space helmet or cosmic frame overlays
**Mascot Integration**: Friendly Astra character appearing in key interaction moments (onboarding, achievements, guidance)
**Company Logos**: User-uploaded within cosmic badge frames (rounded-xl, 128x128px)
**Background Elements**: Subtle star field patterns and nebula gradients (never overwhelming)
**No Large Hero**: Dashboard-focused design prioritizing functional space exploration interface
**Empty States**: Illustrated cosmic scenes (empty space stations, waiting launch pads) with Astra mascot providing friendly guidance

This platform transforms financial education into an engaging space exploration adventure, making complex concepts approachable through familiar cosmic metaphors while maintaining the professional functionality students need to learn real financial skills.