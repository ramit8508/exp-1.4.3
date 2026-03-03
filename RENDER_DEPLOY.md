# Deploying to Render

This guide will help you deploy the Ticket Booking System to Render.

## Prerequisites

- A [Render account](https://render.com) (free tier available)
- Your code in a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Options

### Option 1: Using render.yaml (Infrastructure as Code) - Recommended

1. **Push your code to a Git repository**

2. **Connect to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect the `render.yaml` file

3. **Deploy:**
   - Click "Apply" to create all services defined in render.yaml
   - Render will automatically create:
     - A Web Service for your API
     - A Redis instance
   - All environment variables and connections will be configured automatically

### Option 2: Manual Deployment

#### Step 1: Create Redis Instance

1. In Render Dashboard, click "New +" → "Redis"
2. Configure:
   - **Name:** `ticket-booking-redis`
   - **Region:** Choose closest to your users
   - **Plan:** Free
3. Click "Create Redis"
4. Save the connection details (Internal Redis URL)

#### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name:** `ticket-booking-api`
   - **Region:** Same as Redis
   - **Branch:** main (or your default branch)
   - **Root Directory:** `exp-1.4.3` (if in monorepo)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

#### Step 3: Configure Environment Variables

Add these environment variables in Render dashboard:

```
NODE_ENV=production
REDIS_HOST=<your-redis-internal-host>
REDIS_PORT=<your-redis-port>
REDIS_PASSWORD=<your-redis-password>
TOTAL_SEATS=50
LOCK_TIMEOUT=5000
PROCESSING_MIN_DELAY=100
PROCESSING_MAX_DELAY=300
CORS_ORIGIN=*
```

**Note:** For Redis connection details, use the Internal Redis URL from your Redis instance.

#### Step 4: Deploy

- Click "Create Web Service"
- Render will build and deploy your application
- Wait for the deployment to complete

## Testing Your Deployment

Once deployed, test your API:

```bash
# Health check
curl https://your-app.onrender.com/api/health

# Get available seats
curl https://your-app.onrender.com/api/bookings/seats

# Book a seat
curl -X POST https://your-app.onrender.com/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"seatNumber": 1, "customerName": "John Doe"}'
```

## Important Notes

### Free Tier Limitations

- Web services spin down after 15 minutes of inactivity
- First request after spin-down may take 30+ seconds
- Redis data persists but has storage limits

### Automatic Deploys

- Render automatically deploys when you push to your connected branch
- You can disable this in Service Settings

### Custom Domain

1. Go to Service Settings → Custom Domain
2. Add your domain
3. Configure DNS records as shown

### Monitoring

- View logs in the Render Dashboard under "Logs"
- Monitor Redis usage in Redis instance dashboard
- Set up alerts for service failures

## Troubleshooting

### Service Won't Start

1. Check logs for errors
2. Verify all environment variables are set
3. Ensure Redis connection details are correct

### Connection Errors

- Make sure Redis and Web Service are in the same region
- Use the Internal Redis URL (not external)
- Check Redis password is correct

### Performance Issues

- Consider upgrading from Free tier for better performance
- Implement caching strategies
- Optimize database queries

## Scaling (Paid Plans)

For production use, consider:
- Upgrading to Starter plan for persistent service
- Using Redis Pro for better performance
- Enabling autoscaling for high traffic

## Support

For issues specific to:
- **Application code:** Check application logs in Render Dashboard  
- **Render platform:** [Render Support](https://render.com/docs)
- **Redis issues:** Check Redis logs and status

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No (set by Render) |
| `NODE_ENV` | Environment | development | Yes |
| `REDIS_HOST` | Redis host | localhost | Yes |
| `REDIS_PORT` | Redis port | 6379 | Yes |
| `REDIS_PASSWORD` | Redis password | - | Yes (on Render) |
| `REDIS_DB` | Redis database | 0 | No |
| `TOTAL_SEATS` | Available seats | 50 | No |
| `LOCK_TIMEOUT` | Lock timeout (ms) | 5000 | No |
| `PROCESSING_MIN_DELAY` | Min process delay (ms) | 100 | No |
| `PROCESSING_MAX_DELAY` | Max process delay (ms) | 300 | No |
| `CORS_ORIGIN` | CORS origin | * | No |
