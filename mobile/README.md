# AiOS Mobile

React Native / Expo mobile client for the AiOS platform.

## Prerequisites

- Node.js 18+
- npm 9+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- For iOS: Xcode 15+ with iOS Simulator
- For Android: Android Studio with an AVD, or a physical device with Expo Go

## Installation

```bash
cd mobile
npm install
```

## Running

```bash
# Start the Expo development server
npm start

# Open on iOS Simulator
npm run ios

# Open on Android Emulator or device
npm run android

# Open in web browser
npm run web
```

Scan the QR code shown in the terminal with the **Expo Go** app (iOS / Android) to run on a physical device.

## Configuration

The app connects to the AiOS API server. By default it targets `http://localhost:4000`. Update this in the **Settings** tab after launching the app, or set it in a `.env` file:

```bash
EXPO_PUBLIC_API_URL=https://your-aios-server.example.com
```

> **Note:** When running on a physical device or Android emulator, `localhost` won't reach your dev machine. Use your local IP address (e.g. `http://192.168.1.100:4000`) or the Android emulator loopback address `http://10.0.2.2:4000`.

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout (Stack navigator)
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab bar layout
│   │   ├── index.tsx        # Dashboard screen
│   │   ├── agents.tsx       # Agents list screen
│   │   ├── monitor.tsx      # System monitor screen
│   │   ├── terminal.tsx     # Terminal mini-shell
│   │   └── settings.tsx     # Settings screen
│   └── agent/
│       └── [id].tsx         # Agent detail screen
├── package.json
└── tsconfig.json
```
