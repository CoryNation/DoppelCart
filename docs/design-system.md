# Design System Documentation

## Overview

This design system provides a complete, scalable foundation for the DoppleCart application. It combines Material You (Material 3) design principles with pragmatic enterprise design patterns, ensuring consistency, accessibility, and maintainability across the entire application.

## Design Philosophy

- **Hybrid Approach**: Material You aesthetics with enterprise-grade functionality
- **Consistency**: Unified design language across all components
- **Accessibility**: WCAG-compliant color contrasts and interaction patterns
- **Dark Mode**: Full support for light and dark themes
- **Scalability**: Token-based system that grows with the application

## Color System

### Primary Colors

- **Primary**: `#2B4C7E` - Main brand color for primary actions and accents
- **Primary Hover**: `#1e3558` - Darker shade for hover states
- **Primary Active**: `#152642` - Darkest shade for active/pressed states

### Secondary Colors

- **Secondary**: `#E94F37` - Secondary brand color for alternative actions
- **Secondary Hover**: `#d43a23` - Darker shade for hover states
- **Secondary Active**: `#b82e1a` - Darkest shade for active/pressed states

### Surface Colors

**Light Mode:**
- Surface: `#F8F9FA` - Main background
- Surface Container: `#FFFFFF` - Card/container backgrounds
- Surface Container High: `#F0F1F3` - Elevated surfaces
- Surface Container Highest: `#E6E8EC` - Highest elevation

**Dark Mode:**
- Surface: `#1B1E22` - Main background
- Surface Container: `#252932` - Card/container backgrounds
- Surface Container High: `#2E3239` - Elevated surfaces
- Surface Container Highest: `#383D45` - Highest elevation

### Gray Scale

- **Gray 900**: `#202531` - Darkest text
- **Gray 700**: `#414957` - Secondary text
- **Gray 500**: `#6B7384` - Tertiary text
- **Gray 300**: `#AEB4C2` - Disabled text/borders
- **Gray 100**: `#E6E8EC` - Light borders

### Semantic Colors

- **Success**: `#4CAF50` - Success states, confirmations
- **Warning**: `#FFC107` - Warning states, cautions
- **Danger**: `#D32F2F` - Error states, destructive actions

### Usage

Colors are available as CSS variables and Tailwind classes:

```css
/* CSS Variables */
var(--color-primary)
var(--color-text-primary)
var(--color-surface-container)
```

```tsx
// Tailwind Classes
className="bg-primary text-text-on-primary"
className="text-text-secondary"
className="bg-surface-container"
```

## Typography

### Font Family

**Inter** - Modern, readable sans-serif font optimized for UI

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 42px | 700 | 1.2 | Page titles |
| H2 | 32px | 700 | 1.25 | Section titles |
| H3 | 24px | 600 | 1.3 | Subsection titles |
| H4 | 20px | 600 | 1.4 | Card titles |
| H5 | 18px | 600 | 1.4 | Small headings |
| Body L | 16px | 400 | 1.5 | Default body text |
| Body M | 14px | 400 | 1.5 | Secondary text |
| Body S | 12px | 400 | 1.4 | Helper text, labels |

### Usage

```tsx
// Tailwind Classes
<h1 className="text-h1">Heading 1</h1>
<p className="text-body-l">Body text</p>
<span className="text-body-s">Small text</span>
```

## Radius & Shape

- **Default (sm)**: `4px` - Buttons, inputs, small elements
- **Medium (md)**: `8px` - Medium-sized elements
- **Large (lg)**: `12px` - Cards, modals
- **XL**: `16px` - Large containers
- **2XL**: `24px` - Extra large elements
- **Full**: `9999px` - Pills, badges

### Usage

```tsx
className="rounded-sm"   // 4px
className="rounded-md"  // 8px
className="rounded-lg"  // 12px
className="rounded-full" // Pill shape
```

## Motion

### Duration

- **Fast**: `150ms` - Quick interactions (hover, focus)
- **Normal**: `200ms` - Standard transitions

### Easing

- **Motion Easing**: `cubic-bezier(0.2, 0.0, 0, 1)` - Material Design easing curve

### Usage

```tsx
className="transition-motion"        // 200ms with motion easing
className="transition-motion-fast"  // 150ms with motion easing
```

## Components

### Button

Four variants with consistent sizing and states.

**Variants:**
- `filled` - Primary actions (default)
- `tonal` - Secondary actions with background tint
- `outline` - Tertiary actions with border
- `text` - Text-only actions

**Sizes:**
- `sm` - Small (12px text, compact padding)
- `md` - Medium (14px text, standard padding) - default
- `lg` - Large (16px text, generous padding)

**Usage:**

```tsx
import Button from "@/components/ui/button";

<Button variant="filled" size="lg">Primary Action</Button>
<Button variant="outline">Secondary Action</Button>
<Button variant="text" disabled>Disabled</Button>
<Button fullWidth>Full Width Button</Button>
```

### Input

Form inputs with multiple variants and error states.

**Variants:**
- `border` - Standard input with border (default)
- `filled` - Input with background fill

**Features:**
- Label support
- Helper text
- Error states with error messages
- Accessibility attributes (ARIA)

**Usage:**

```tsx
import Input from "@/components/ui/input";

<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  variant="border"
/>

<Input
  label="Password"
  type="password"
  error
  errorMessage="Password is required"
/>

<Input
  label="Username"
  helperText="Choose a unique username"
/>
```

### Card

Container component for grouping content.

**Variants:**
- `elevated` - Shadow elevation (default)
- `outlined` - Border outline
- `filled` - Background fill

**Padding:**
- `none` - No padding
- `sm` - Small padding (16px)
- `md` - Medium padding (24px) - default
- `lg` - Large padding (32px)

**Subcomponents:**
- `CardHeader` - Header section
- `CardTitle` - Card title
- `CardDescription` - Card description
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Usage:**

```tsx
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card variant="elevated" padding="lg">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

### Badge

Small status indicators and labels.

**Variants:**
- `default` - Neutral badge
- `success` - Success state
- `warning` - Warning state
- `danger` - Error/danger state
- `secondary` - Secondary color

**Sizes:**
- `sm` - Small (12px text)
- `md` - Medium (14px text) - default

**Usage:**

```tsx
import Badge from "@/components/ui/badge";

<Badge variant="success">Active</Badge>
<Badge variant="danger" size="sm">3</Badge>
<Badge variant="warning">Pending</Badge>
```

### Modal

Dialog component for overlays and confirmations.

**Features:**
- Backdrop blur
- Keyboard navigation (ESC to close)
- Click outside to close
- Accessible ARIA attributes
- Multiple sizes

**Sizes:**
- `sm` - Small (max-width: 448px)
- `md` - Medium (max-width: 512px) - default
- `lg` - Large (max-width: 672px)
- `xl` - Extra Large (max-width: 896px)

**Usage:**

```tsx
import { Modal, ModalFooter } from "@/components/ui/modal";
import { useState } from "react";

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
  size="md"
>
  <p>Modal content goes here</p>
  <ModalFooter>
    <Button variant="text" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button onClick={handleConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
```

### Sidebar

Navigation sidebar component with theme toggle.

**Features:**
- Active state highlighting
- Icon support
- Badge support for notifications
- Built-in theme toggle
- Responsive design

**Usage:**

```tsx
import { Sidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Users } from "lucide-react";

const items = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Personas",
    href: "/personas",
    icon: <Users className="h-5 w-5" />,
    badge: <Badge size="sm" variant="danger">3</Badge>,
  },
];

<Sidebar
  logo={<span>DoppleCart</span>}
  items={items}
/>
```

## Theme Provider

The theme provider manages light/dark mode switching and persists user preferences.

**Usage:**

```tsx
import { ThemeProvider } from "@/components/theme-provider";
import { useTheme } from "@/components/theme-provider";

// In root layout
<ThemeProvider defaultTheme="light">
  {children}
</ThemeProvider>

// In components
const { theme, setTheme, toggleTheme } = useTheme();
```

## Dark Mode

Dark mode is fully supported across all components. The theme automatically adapts:

- Surface colors invert appropriately
- Text colors maintain contrast ratios
- Shadows adjust for dark backgrounds
- All components respect the current theme

Toggle dark mode using the theme provider:

```tsx
const { toggleTheme } = useTheme();
<Button onClick={toggleTheme}>Toggle Theme</Button>
```

## Best Practices

### Component Usage

1. **Always use design system components** - Don't create custom styled components when a design system component exists
2. **Use semantic variants** - Choose variants that match the semantic meaning (e.g., `danger` for errors)
3. **Maintain consistency** - Use consistent spacing, sizing, and styling patterns
4. **Accessibility first** - Always include proper labels, ARIA attributes, and keyboard navigation

### Color Usage

1. **Text colors** - Use `text-text-primary` for main text, `text-text-secondary` for secondary text
2. **Backgrounds** - Use `bg-surface` for page backgrounds, `bg-surface-container` for cards
3. **Borders** - Use `border-border` for standard borders, `border-border-focus` for focus states

### Typography

1. **Hierarchy** - Use heading sizes to establish clear visual hierarchy
2. **Readability** - Prefer `text-body-l` for main content, `text-body-m` for secondary content
3. **Consistency** - Use the same text size for similar content types

### Motion

1. **Transitions** - Always use `transition-motion` or `transition-motion-fast` for smooth animations
2. **Duration** - Use fast transitions for hover/focus, normal for state changes
3. **Easing** - Always use the motion easing curve for natural-feeling animations

## Examples

See `/design-system` page for a complete showcase of all components and their variations.

## Migration Guide

When migrating existing components:

1. Replace custom colors with design system tokens
2. Replace custom typography with design system type scale
3. Replace custom components with design system components
4. Ensure dark mode compatibility
5. Add proper accessibility attributes

## Resources

- [Design System Demo](/design-system) - Interactive component showcase
- [Material Design 3](https://m3.material.io/) - Design inspiration
- [Tailwind CSS](https://tailwindcss.com/) - Utility framework documentation











