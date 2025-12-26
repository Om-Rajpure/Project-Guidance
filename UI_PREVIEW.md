# 🎨 UI Preview - Login/Signup Page

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    ╔═══════════════════╗                    │
│    🌟 Floating     ║  Project Guidance ║    🌟 Animated    │
│    Gradient Orbs   ║  AI-Orchestrated  ║    Background     │
│                    ║  Project Building ║                    │
│                    ╚═══════════════════╝                    │
│                                                              │
│              ┌─────────────┬─────────────┐                  │
│              │   Login  ✓  │   Sign Up   │                  │
│              └─────────────┴─────────────┘                  │
│                                                              │
│    ┌────────────────────────────────────────────┐           │
│    │  Select Your Role                          │           │
│    │                                            │           │
│    │  ┌──────────────────────────────────┐     │           │
│    │  │  👑  Team Leader                 │     │ (Only in  │
│    │  │      Create & manage projects    │  ✓  │  Signup)  │
│    │  └──────────────────────────────────┘     │           │
│    │                                            │           │
│    │  ┌──────────────────────────────────┐     │           │
│    │  │  👤  Member                      │     │           │
│    │  │      Join & collaborate          │     │           │
│    │  └──────────────────────────────────┘     │           │
│    └────────────────────────────────────────────┘           │
│                                                              │
│    ┌────────────────────────────────────────────┐           │
│    │  Full Name                                 │           │
│    │  [                                  ]      │           │
│    └────────────────────────────────────────────┘           │
│                                                              │
│    ┌────────────────────────────────────────────┐           │
│    │  Email Address                             │           │
│    │  [                                  ]      │           │
│    └────────────────────────────────────────────┘           │
│                                                              │
│    ┌────────────────────────────────────────────┐           │
│    │  Password                                  │           │
│    │  [                                  ]      │           │
│    └────────────────────────────────────────────┘           │
│                                                              │
│    ┌────────────────────────────────────────────┐           │
│    │          Create Account / Login            │           │
│    └────────────────────────────────────────────┘           │
│                                                              │
│         Already have an account? Sign Up                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Color Scheme

### Background
```
Dark Gradient: #0a0a0f → #1a1a2e
```

### Floating Orbs (Animated)
```
Orb 1: Purple-Blue Gradient (#667eea → #764ba2)
Orb 2: Pink Gradient      (#f093fb → #f5576c)
Orb 3: Cyan Gradient      (#4facfe → #00f2fe)
```

### Card
```
Background: rgba(26, 26, 46, 0.8) with backdrop-blur
Border: rgba(255, 255, 255, 0.1)
Border Radius: 24px
Shadow: Heavy shadow for depth
```

### Buttons
```
Active Tab: Linear gradient (#667eea → #764ba2)
Inactive Tab: Transparent with hover effect
Submit: Same gradient with glow on hover
Role Cards: Semi-transparent with border glow when selected
```

### Text
```
Title: Gradient text (#667eea → #764ba2)
Labels: rgba(255, 255, 255, 0.8)
Placeholders: rgba(255, 255, 255, 0.3)
Body Text: rgba(255, 255, 255, 0.6)
```

## Animations

### Page Load
- **Card:** Slides up from bottom (0.6s)
- **Title:** Fades in (0.8s)
- **Subtitle:** Fades in (1s)

### Continuous
- **Orbs:** Float and scale (20s loop)
- Each orb has different delay (0s, 7s, 14s)

### Interactions
- **Button Hover:** Lifts 2px with glow
- **Input Focus:** Border color change + glow
- **Role Select:** Smooth highlight animation
- **Tab Switch:** Instant background shift
- **Form Submit:** Loading spinner rotation

### Alerts
- **Success/Error:** Slides down from top (0.3s)

## States

### Loading State
```
┌────────────────────────────────────────────┐
│              ⟳ Loading...                  │  (Spinner animation)
└────────────────────────────────────────────┘
```

### Error State
```
┌────────────────────────────────────────────┐
│  ⚠️  User already exists with this email   │  (Red background)
└────────────────────────────────────────────┘
```

### Success State
```
┌────────────────────────────────────────────┐
│  ✅  Login successful                      │  (Green background)
└────────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (> 640px)
- Card: 480px max-width, centered
- Padding: 48px
- Font sizes: Standard

### Mobile (< 640px)
- Card: Full width with 20px margin
- Padding: 32px 24px
- Font sizes: Slightly reduced
- Role icons: Smaller

## Interactive Elements

### Hover Effects
1. **Toggle Buttons:** Color brightens
2. **Role Cards:** Lifts up 2px, border glows
3. **Submit Button:** Lifts up 2px, shadow increases
4. **Link Button:** Color changes + underline

### Focus States
1. **Input Fields:** Border glow + background lightens
2. **Buttons:** Outline (for accessibility)

### Active States
1. **Tab Button:** Gradient background + shadow
2. **Role Card:** Gradient background + strong glow
3. **Submit Button:** No lift (pressed down)

## Typography

### Font Family
```
Primary: 'Inter' (Google Fonts)
Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', ...
```

### Font Sizes
```
Title: 32px (28px mobile)
Subtitle: 14px
Tab Buttons: 15px
Labels: 14px
Inputs: 15px
Role Title: 16px
Role Subtitle: 13px
Alerts: 14px
Footer: 14px
```

### Font Weights
```
Title: 700
Role Title: 600
Submit Button: 600
Tab Buttons: 500
Labels: 500
Regular Text: 400
Subtitle: 400
```

## Accessibility Features

- ✅ Semantic HTML
- ✅ Proper labels for inputs
- ✅ Focus indicators
- ✅ Keyboard navigation support
- ✅ Color contrast ratios met
- ✅ Loading states announced
- ✅ Error messages clear

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ⚠️ Backdrop filter may not work on older browsers

---

**Note:** The actual implementation includes smooth CSS transitions and will look even better in action!
