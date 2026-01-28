# WontanConnect Mobile App

> Connect the Guinean diaspora worldwide 🌍

A premium React Native mobile application for peer-to-peer currency exchange and shipping services matching.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
# Navigate to the mobile app directory
cd wc-mobile

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running the App

```bash
# iOS (macOS only)
npx expo start --ios

# Android
npx expo start --android

# Web (for quick preview)
npx expo start --web
```

## 📁 Architecture

This project follows a **domain-driven folder structure** designed for scalability:

```
src/
├── app/                    # App bootstrap & navigation
│   ├── navigation/         # React Navigation setup
│   │   ├── types.ts        # Navigation type definitions
│   │   ├── AppNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   └── stacks/         # Feature-specific stack navigators
│   └── store/              # Global state (Zustand)
│
├── design/                 # Design system
│   ├── tokens/             # Design tokens
│   │   ├── colors.ts       # Color palette
│   │   ├── spacing.ts      # Spacing scale
│   │   ├── typography.ts   # Font styles
│   │   ├── radius.ts       # Border radius
│   │   ├── shadows.ts      # Shadow definitions
│   │   └── animation.ts    # Animation presets
│   └── theme.ts            # Unified theme object
│
├── components/             # Shared UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Avatar.tsx
│   ├── Skeleton.tsx
│   ├── EmptyState.tsx
│   └── ...
│
├── features/               # Feature modules
│   ├── fx/                 # Currency exchange
│   │   ├── screens/
│   │   ├── components/
│   │   ├── model/          # TypeScript types
│   │   ├── data/           # Mock data
│   │   └── store/          # Feature state
│   ├── shipping/           # Shipping/containers
│   ├── messages/           # Chat/inbox
│   ├── profile/            # User profile
│   └── onboarding/         # Onboarding flow
│
├── i18n/                   # Internationalization
│   ├── index.ts            # i18next config
│   └── locales/
│       ├── fr.json         # French (default)
│       └── en.json         # English
│
├── utils/                  # Utility functions
└── assets/                 # Images, fonts, icons
```

## 🎨 Design System

### Design Tokens

All design decisions are centralized in tokens:

- **Colors**: Primary (indigo), secondary (amber), semantic colors
- **Spacing**: 4pt grid system (8, 16, 24, 32...)
- **Typography**: System fonts with consistent scale
- **Shadows**: Elevation system for depth
- **Animation**: Timing and easing presets

### Components

Pre-built components following our design system:

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, ghost, outline variants |
| `Input` | Text input with label, error states |
| `Card` | Container with shadow and press animation |
| `Tag` | Status badges and labels |
| `Avatar` | User profile images with fallback |
| `Skeleton` | Loading placeholders |
| `EmptyState` | Empty list states with CTA |
| `Modal` | Confirmation dialogs |
| `Toast` | Notification feedback |

## 🌐 Internationalization

The app supports French (default) and English:

```typescript
// Using translations
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<Text>{t('fx.title')}</Text>
```

Language preference is persisted in AsyncStorage.

## 🗄️ State Management

We use **Zustand** for state management:

**Why Zustand over Redux Toolkit:**
- Minimal boilerplate for MVP
- Simple API with TypeScript inference
- No providers needed
- Easy async actions
- Built-in persistence support

```typescript
// Example store usage
import { useFXStore } from '@/features/fx/store/fxStore';

const { offers, loadOffers, addOffer } = useFXStore();
```

## 📱 Screens

### MVP Screens

1. **Onboarding** - 3-slide introduction
2. **FX Exchange**
   - List (with filters)
   - Detail (with trust banner)
   - Create form
3. **Shipping**
   - List (with filters)
   - Detail
   - Create form
4. **Messages**
   - Inbox (conversations list)
   - Chat (message thread)
5. **Profile**
   - User info & stats
   - Settings (language toggle)

## 🎭 Animations

Premium micro-interactions powered by `react-native-reanimated`:

- Card press feedback (scale 0.97)
- Screen transitions (slide from right)
- List items staggered entry
- Bottom sheet snap points
- Toast slide animations

## 🔒 Trust & Safety

Built-in trust features:
- Trust banners with safety tips
- Verified user badges
- Rating display
- Clear user identification

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` | Development platform |
| `react-navigation` | Navigation |
| `react-native-reanimated` | Animations |
| `zustand` | State management |
| `react-i18next` | Internationalization |
| `@gorhom/bottom-sheet` | Bottom sheets |

## 🧪 Development

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Start with cache clear
npx expo start -c
```

## 📄 Documentation

- [Design System](./docs/DESIGN_SYSTEM_MOBILE.md)
- [Product Requirements](./docs/PRODUCT_REQUIREMENTS.md)
- [Project Status](./docs/STATUS.md)

## 🗺️ Roadmap

### MVP (Current)
- [x] Frontend-only with mock data
- [x] FX exchange matching
- [x] Shipping offers matching
- [x] Mock messaging
- [x] Profile & settings
- [x] i18n (FR/EN)

### Post-MVP
- [ ] Backend integration
- [ ] Real-time messaging
- [ ] Push notifications
- [ ] User verification
- [ ] Rating system
- [ ] Escrow payments

---

**Built with ❤️ for the Guinean diaspora**
