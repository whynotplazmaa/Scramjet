# Deploying Scramjet to Render

This guide explains how to deploy the Scramjet web proxy application to Render.

## Option 1: Using Render Dashboard (Recommended)

### Prerequisites
- A [Render account](https://render.com)
- Your Scramjet repository pushed to GitHub

### Steps

1. **Connect your GitHub repository**
   - Go to [render.com](https://render.com)
   - Click "New+" and select "Web Service"
   - Select "Connect repository"
   - Choose your Scramjet repository

2. **Configure the service**
   - **Name**: `scramjet` (or your preferred name)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`
   - **Plan**: Free or Starter

3. **Environment Variables**
   - `NODE_ENV`: `production`
   - `PORT`: `8080` (Render automatically provides this)

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy from your repository
   - Your app will be available at `https://your-app-name.onrender.com`

## Option 2: Using render.yaml Configuration

The repository includes a `render.yaml` file with pre-configured deployment settings. Simply push it to your repository and Render will auto-detect the configuration.

## Environment Setup

Create a `.env` file in your project root (optional for local development):
```
NODE_ENV=production
PORT=8080
```

See `.env.example` for available options.

## Build and Deployment

- **Build Time**: First deployment takes 3-5 minutes
- **Subsequent Deployments**: Usually 1-2 minutes
- **Auto-deploy**: Enabled - deploys on every push to the main branch

## Monitoring

After deployment:
1. Visit your app URL: `https://your-app-name.onrender.com`
2. Check logs in the Render dashboard under "Logs"
3. Monitor performance metrics in the dashboard

## Troubleshooting

### Build Fails
- Check the build logs in the Render dashboard
- Ensure all dependencies are listed in `package.json`
- Verify Node version compatibility (18+)

### App Crashes After Deploy
- Check the logs in Render dashboard
- Ensure `PORT` environment variable is set (Render sets this automatically)
- Verify server.js is executable

### Port Issues
- Render automatically assigns a port; don't hardcode port 8080
- The server.js already reads from `process.env.PORT`

## Advanced Configuration

To customize further, edit `render.yaml`:
```yaml
services:
  - type: web
    name: scramjet
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: node server.js
    plan: free  # or starter, standard
    regions:
      - oregon
```

## Scaling

- **Free Plan**: Spins down after 15 minutes of inactivity
- **Starter Plan**: Always running, suitable for production
- **Scale up**: Upgrade plan in Render dashboard for more resources

## Additional Resources

- [Render Node.js Documentation](https://render.com/docs/deploy-node-express-app)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Render Pricing](https://render.com/pricing)
