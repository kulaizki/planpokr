# PlanPokr - Real-time Planning Poker

A modern, real-time planning poker application for agile teams to estimate user stories efficiently and collaboratively.

![PlanPokr](https://img.shields.io/badge/PlanPokr-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Real-time Collaboration**: Instantly see votes and status updates from all team members
- **No Account Required**: Generate a unique game link and share with your team to start immediately
- **Automatic Vote Reveal**: Votes are automatically revealed when everyone has voted
- **Story Management**: Set and reset stories for continuous estimation sessions
- **Mobile Responsive**: Works on all devices, from phones to desktops
- **Copy Invite Link**: Easily share the game with team members
- **Player Presence**: See who's online and their voting status

## Tech Stack

- **Frontend**: [Svelte 5](https://svelte.dev) & [SvelteKit](https://kit.svelte.dev/)
- **Styling**: [TailwindCSS](https://tailwindcss.com)
- **Real-time Backend**: [Supabase](https://supabase.com)
- **TypeScript**: For type safety and better developer experience
- **Architecture**: Modular design with separation of concerns:
  - `realtime.ts`: WebSocket communication layer
  - `gameStore.ts`: State management
  - `game.service.ts`: Service layer for UI operations

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or pnpm
- A Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/planpokr.git
   cd planpokr
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with your Supabase credentials:
   ```
   PUBLIC_SUPABASE_URL=your-supabase-url
   PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## Database Schema

PlanPokr uses three main tables in Supabase:

1. **games**:
   - `id`: unique identifier for the game
   - `current_story`: the current story being estimated
   - `revealed`: boolean indicating if votes are revealed

2. **players**:
   - `id`: unique identifier for the player
   - `game_id`: reference to the game
   - `name`: player's name
   - `voted`: boolean indicating if player has voted

3. **votes**:
   - `player_id`: reference to the player
   - `game_id`: reference to the game
   - `value`: the player's vote value (null if not voted)

## Project Structure

```
src/
├── lib/
│   ├── components/     # UI components
│   ├── services/       # Service layer
│   ├── stores/         # State management
│   ├── supabase/       # Supabase client
│   ├── types/          # TypeScript types
│   └── realtime.ts     # WebSocket communication
├── routes/             # SvelteKit routes
└── app.html            # SvelteKit app shell
```

## Usage

1. Create a new game by clicking "Start New Game" on the home page
2. Enter your name to join the game
3. Share the generated link with your team members
4. Enter a user story in the story input field
5. Team members select their estimations
6. Votes are automatically revealed when everyone has voted
7. Click "Next Story" to reset and start a new estimation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License .