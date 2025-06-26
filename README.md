# Tic-Tac-Toe Multiplayer

A real-time multiplayer Tic-Tac-Toe game built with Next.js, TypeScript, and Pusher.

## Features

- Real-time multiplayer gameplay
- Room-based matchmaking with shareable codes
- In-game chat system
- Responsive design for desktop and mobile
- Serverless architecture for easy deployment

## Technologies Used

- **Next.js**: React framework for server-rendered applications
- **TypeScript**: Typed JavaScript for better developer experience
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Pusher**: Real-time communication platform
- **Vercel**: Deployment platform optimized for Next.js

## Getting Started

### Prerequisites

- Node.js 14+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tictactoe-multiplayer.git
cd tictactoe-multiplayer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Pusher credentials:
```
NEXT_PUBLIC_PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## How to Play

1. On the home screen, enter your name and create a new game
2. Share the room ID with a friend
3. Wait for your friend to join
4. The host (X) starts the game
5. Take turns placing your symbols (X or O) on the board
6. The first player to get three in a row wins!

## Deployment

See the [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) for detailed instructions on deploying to Vercel.

## Project Structure

```
/
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js app directory
│   │   ├── game/       # Game room page
│   │   └── page.tsx    # Home page
│   ├── components/     # React components
│   ├── lib/            # Utility functions and libraries
│   │   ├── pusher.js   # Pusher configuration
│   │   └── game-client.js # Game client utilities
│   └── pages/          # API routes
│       └── api/        # API endpoints
└── ...                 # Configuration files
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 