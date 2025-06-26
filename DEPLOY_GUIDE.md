# Deployment Guide for Tic-Tac-Toe Multiplayer

This guide will help you deploy your Tic-Tac-Toe Multiplayer game on Vercel.

## Prerequisites

- A [Vercel](https://vercel.com) account
- A [Pusher](https://pusher.com) account (free tier is sufficient)

## Step 1: Set up Pusher

1. Sign up or log in to [Pusher](https://pusher.com)
2. Create a new Channels app
3. Select a name for your app (e.g., "tic-tac-toe-multiplayer")
4. Choose a cluster closest to your target audience
5. Take note of your Pusher credentials:
   - App ID
   - Key
   - Secret
   - Cluster

## Step 2: Update Environment Variables

1. In your local project, create a `.env.local` file (if it doesn't exist)
2. Add the following variables with your Pusher credentials:

```
NEXT_PUBLIC_PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

## Step 3: Deploy to Vercel

1. Push your code to a GitHub repository
2. Log in to [Vercel](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. In the "Configure Project" screen:
   - Add the environment variables from Step 2
   - Optionally, change the project name
6. Click "Deploy"

## Step 4: Test Your Deployment

1. Once deployment is complete, visit your Vercel project URL
2. Create a new game and copy the room ID
3. Open another browser or incognito window
4. Join the game using the room ID
5. Verify that both players can see each other and play the game

## Troubleshooting

If you encounter issues:

1. **Pusher Connection Errors**:
   - Verify your Pusher credentials are correct
   - Check that environment variables are set correctly on Vercel
   - Ensure your app is using the correct Pusher cluster

2. **API Errors (404/500)**:
   - Check Vercel deployment logs for any server-side errors
   - Verify API routes are working correctly

3. **Game State Issues**:
   - Clear browser cache and reload the page
   - Check browser console for any JavaScript errors

## Additional Configuration

### Custom Domain

To use a custom domain:

1. Go to your Vercel project settings
2. Click on "Domains"
3. Add your domain and follow Vercel's instructions to configure DNS

### Scaling

The default configuration uses Pusher's free tier, which includes:
- 100 simultaneous connections
- 200k messages per day

For production use with higher traffic, consider upgrading your Pusher plan.

## Support

If you need help, feel free to:
- Open an issue on GitHub
- Contact the project maintainers
- Refer to the [Pusher documentation](https://pusher.com/docs) or [Vercel documentation](https://vercel.com/docs) 