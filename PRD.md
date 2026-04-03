# ConTrails - Cyber Security Conference Tracker

A global platform for Microsoft Security MVPs to discover cyber security conferences and see which peers are attending, fostering networking and community connections across the security community.

**Experience Qualities**:
1. **Professional** - Clean, trustworthy interface that reflects the seriousness of the cyber security community while remaining approachable
2. **Connected** - Emphasizes community and networking, making it easy to see who's attending and plan meetups
3. **Global** - Presents worldwide conference data in an accessible way, with clear location and date information

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused tool with conference browsing, attendance tracking, and user presence features - more than a single-purpose tool but not requiring complex workflows or multiple interconnected views.

## Essential Features

### Conference Listing
- **Functionality**: Display upcoming cyber security conferences with key details (name, location, dates, description)
- **Purpose**: Provides MVPs with a comprehensive view of global security events
- **Trigger**: Default view on app load
- **Progression**: App loads → Conference grid displays → User scans events → Can filter/search
- **Success criteria**: All conferences visible, sortable by date, filterable by location/topic

### Attendance Tracking
- **Functionality**: MVPs can mark conferences they plan to attend and see attendee counts
- **Purpose**: Enables community visibility and networking opportunities
- **Trigger**: User clicks "I'm Going" button on a conference card
- **Progression**: User views conference → Clicks attendance toggle → Status updates → Attendee list updates
- **Success criteria**: Attendance persists, count updates immediately, user can toggle on/off

### Attendee Visibility
- **Functionality**: View which MVPs are attending each conference
- **Purpose**: Facilitates pre-event networking and meetup planning
- **Trigger**: User clicks to expand attendee list on conference card
- **Progression**: User selects conference → Expands attendee section → Views MVP list → Can identify networking opportunities
- **Success criteria**: Attendee names display clearly, updates in real-time when users join/leave

### Conference Management
- **Functionality**: Add new conferences to the platform (owner-only feature)
- **Purpose**: Keeps the platform current with latest security events
- **Trigger**: Owner clicks "Add Conference" button
- **Progression**: Owner clicks add → Form appears → Enters details → Submits → Conference appears in list
- **Success criteria**: Form validates input, new conferences appear immediately, sorted chronologically

## Edge Case Handling

- **No Conferences**: Display encouraging empty state with "Add Conference" CTA for owners, informative message for others
- **Past Conferences**: Automatically filter or visually distinguish past events, maintain for historical reference
- **No Attendees Yet**: Show "Be the first to attend!" messaging to encourage engagement
- **Concurrent Conferences**: Clear visual separation and date/location prominence for scheduling conflicts
- **Long Conference Names**: Truncate gracefully with ellipsis and full name on hover

## Design Direction

The design should evoke trust, professionalism, and global connectivity - reflecting the cyber security community's technical expertise while emphasizing the human connections that conferences create. It should feel modern and authoritative like a security dashboard, but warmer and more inviting to encourage community participation.

## Color Selection

A sophisticated palette inspired by cyber security aesthetics - deep blues suggesting trust and technology, with electric accents representing digital connections and alerts.

- **Primary Color**: Deep Cyber Blue `oklch(0.35 0.12 250)` - Commands authority and trust, represents the technical security domain
- **Secondary Colors**: Slate backgrounds `oklch(0.96 0.01 250)` for subtle depth, Dark Charcoal `oklch(0.25 0.02 250)` for strong contrast elements
- **Accent Color**: Electric Cyan `oklch(0.70 0.15 200)` - High-tech highlight for interactive elements, attendance indicators, and CTAs
- **Foreground/Background Pairings**: 
  - Primary (Deep Cyber Blue): White text `oklch(1 0 0)` - Ratio 8.2:1 ✓
  - Accent (Electric Cyan): Dark Charcoal `oklch(0.25 0.02 250)` - Ratio 9.1:1 ✓
  - Background (Slate): Deep text `oklch(0.20 0.02 250)` - Ratio 13.5:1 ✓

## Font Selection

Typography should convey technical precision while remaining highly readable for scanning conference details and fostering a sense of modern professionalism.

- **Primary Font**: Space Grotesk - Modern geometric sans with technical character, perfect for the cyber security aesthetic
- **Typographic Hierarchy**:
  - H1 (Page Title "ConTrails"): Space Grotesk Bold/32px/tight letter-spacing
  - H2 (Conference Names): Space Grotesk SemiBold/20px/normal spacing
  - H3 (Section Headers): Space Grotesk Medium/16px/normal spacing
  - Body (Details/Descriptions): Space Grotesk Regular/14px/relaxed line-height (1.6)
  - Small (Dates/Locations): Space Grotesk Medium/13px/tight line-height

## Animations

Animations should be purposeful and swift - emphasizing state changes and guiding attention without feeling playful. Think smooth data transitions rather than bouncy interactions.

- **Card Interactions**: Subtle lift on hover (2-4px translate-y) with soft shadow expansion
- **Attendance Toggle**: Quick scale pulse (1.0 → 1.05 → 1.0) over 200ms when clicked to confirm action
- **Attendee List Expansion**: Smooth height transition (300ms ease-out) when expanding/collapsing
- **New Conference Addition**: Fade-in with slight upward slide (opacity 0→1, translate-y 10px→0px) over 400ms
- **Filter/Search**: Instant visual feedback with 150ms fade for appearing/disappearing conferences

## Component Selection

- **Components**:
  - Card: Conference display with image, details, and attendance controls
  - Button: Primary CTAs (I'm Going, Add Conference), hover states with accent color
  - Dialog: Modal form for adding new conferences (owner only)
  - Badge: Conference topics/tags, attendee counts with accent background
  - Avatar: MVP profile pictures in attendee lists (fallback to initials)
  - Input: Search and filter controls with clean borders
  - Separator: Dividing sections within cards
  - ScrollArea: Attendee lists within cards

- **Customizations**:
  - Conference cards with custom gradient overlays on header images
  - Attendance toggle button with icon transition (plus → check)
  - Global background with subtle dotted grid pattern using repeating-linear-gradient
  - Header with gradient background featuring the primary→accent color shift

- **States**:
  - Buttons: Default (accent color), Hover (lighter accent), Active (darker), Disabled (muted gray)
  - Conference Cards: Default (white), Hover (subtle shadow lift), Attending (accent border indicator)
  - Attendance Toggle: Unmarked (outline style), Marked (solid accent fill with check icon)

- **Icon Selection**:
  - CalendarDots: Conference dates
  - MapPin: Conference locations
  - Users: Attendee counts
  - Plus/Check: Attendance toggle states
  - MagnifyingGlass: Search functionality
  - Globe: Global/region indicators
  - PlusCircle: Add conference action

- **Spacing**:
  - Page padding: p-6 (mobile) / p-8 (desktop)
  - Card padding: p-6
  - Card gaps in grid: gap-6
  - Internal card spacing: space-y-4
  - Button padding: px-6 py-2.5

- **Mobile**:
  - Single column card grid on mobile (<768px), 2 columns on tablet (768-1024px), 3 columns on desktop (>1024px)
  - Sticky header that collapses search/filters into dropdown menu on mobile
  - Full-width cards with increased touch targets (min 44px) for attendance buttons
  - Attendee lists display as chips/badges on mobile instead of full avatar list
