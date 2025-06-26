import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Pusher credentials - using fallbacks for development only
const appId = process.env.NEXT_PUBLIC_PUSHER_APP_ID || '1764088';
const key = process.env.NEXT_PUBLIC_PUSHER_KEY || 'f36ae9f1e6e4cff67bf5';
const secret = process.env.PUSHER_SECRET || '1e3bdb3a06a5cbab0d82';
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1';

// Mock pusher for development if needed
const createMockPusher = () => {
  console.warn('Using mock Pusher implementation for development');
  return {
    trigger: async () => Promise.resolve(),
    subscribe: () => ({
      bind: () => {},
      bind_all: () => {},
      unbind: () => {},
      unbind_all: () => {},
      unsubscribe: () => {},
    }),
    unsubscribe: () => {},
    disconnect: () => {},
    connect: () => {},
  };
};

// Initialize Pusher server with error handling
export let pusherServer;
try {
  pusherServer = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
} catch (error) {
  console.error('Error initializing Pusher server:', error);
  pusherServer = createMockPusher();
}

// Initialize Pusher client with error handling
export let pusherClient;
try {
  // Only create real client in browser environment
  if (typeof window !== 'undefined') {
    pusherClient = new PusherClient(key, {
      cluster,
      forceTLS: true,
    });
  } else {
    pusherClient = createMockPusher();
  }
} catch (error) {
  console.error('Error initializing Pusher client:', error);
  pusherClient = createMockPusher();
}

// Export a wrapped version of trigger that handles errors
export const safeTrigger = async (channel, event, data) => {
  try {
    if (isDevelopment) {
      console.log(`[DEV] Pusher trigger: ${channel} - ${event}`, data);
      return Promise.resolve();
    }
    return await pusherServer.trigger(channel, event, data);
  } catch (error) {
    console.error(`Error triggering Pusher event ${event} on ${channel}:`, error);
    return Promise.resolve();
  }
};

// These are free Pusher credentials created for this demo
// In production, you should use your own Pusher account
// and set up proper environment variables 