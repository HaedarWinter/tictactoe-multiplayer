import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Pusher credentials
const appId = process.env.NEXT_PUBLIC_PUSHER_APP_ID || '1764088';
const key = process.env.NEXT_PUBLIC_PUSHER_KEY || 'f36ae9f1e6e4cff67bf5';
const secret = process.env.PUSHER_SECRET || '1e3bdb3a06a5cbab0d82';
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1';

// Initialize Pusher server (for API routes)
export const pusherServer = new Pusher({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});

// Initialize Pusher client (for frontend)
export const pusherClient = new PusherClient(key, {
  cluster,
  forceTLS: true,
});

// These are free Pusher credentials created for this demo
// In production, you should use your own Pusher account
// and set up proper environment variables 