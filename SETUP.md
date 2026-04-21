# Lumyn Delivery - Setup Guide

Welcome to the Lumyn Delivery application! This document will guide you through setting up the project locally and deploying it.

## Prerequisites

- Node.js 18+ and pnpm
- A Neon PostgreSQL database (free tier available)
- Clerk authentication account (free tier available)

## Environment Variables

You need to set up the following environment variables. Add them to your `.env.local` file:

### Database
- `DATABASE_URL` - Your Neon PostgreSQL connection string
  - Format: `postgresql://user:password@host/database`

### Clerk Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key (public, safe to expose)
- `CLERK_SECRET_KEY` - Your Clerk secret key (keep this private!)
- `CLERK_WEBHOOK_SECRET` - Webhook signing secret from Clerk dashboard

### Admin Configuration
- `ADMIN_USER_IDS` - Comma-separated list of Clerk user IDs with admin access
  - Example: `user_1234567890,user_0987654321`

## Setup Steps

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Database

First, create a new Neon PostgreSQL database:
1. Go to https://console.neon.tech
2. Create a new project
3. Copy your connection string
4. Add it as `DATABASE_URL` in `.env.local`

Then run the Prisma setup:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 3. Configure Clerk

1. Go to https://dashboard.clerk.com
2. Create a new application or select existing
3. Copy your publishable and secret keys
4. Add them to `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET` (from Webhooks section)

### 4. Set Admin User IDs

After creating your first user in Clerk:
1. Go to Users in your Clerk dashboard
2. Copy the User ID
3. Add it to `ADMIN_USER_IDS` in `.env.local`

### 5. Configure Webhook (Important!)

1. In your Clerk dashboard, go to Webhooks
2. Create a new webhook endpoint:
   - URL: `https://yourdomain.com/api/webhooks/clerk`
   - Events to listen to: `user.created`, `user.updated`, `user.deleted`
   - Message signing secret will be provided - save as `CLERK_WEBHOOK_SECRET`

For local development with webhooks, use ngrok:
```bash
ngrok http 3000
```
Then use the ngrok URL for your webhook endpoint.

## Running the Application

### Development
```bash
pnpm dev
```

The app will be available at http://localhost:3000

### Production Build
```bash
pnpm build
pnpm start
```

## Database Schema

The application includes the following Prisma models:

- **User** - Customer and driver accounts with Clerk integration
- **Driver** - Extended driver profile with license and vehicle info
- **Address** - Delivery addresses with geocoding support
- **Delivery** - Main delivery orders with status tracking
- **Order** - Associated orders with delivery status
- **Review** - Customer reviews and ratings for drivers

## PWA Features

The application includes Progressive Web App (PWA) capabilities:
- Installable on mobile and desktop
- Offline support with service worker
- Push notification ready
- Background sync ready

To install locally:
1. Open the app in a compatible browser (Chrome, Edge, Safari 16.4+)
2. Look for "Install app" prompt or use the browser menu

## API Endpoints

### Public Routes
- `GET /` - Landing page
- `POST /api/webhooks/clerk` - Clerk webhook handler

### Authenticated Routes
- `GET /api/deliveries` - List deliveries
- `POST /api/deliveries` - Create delivery
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Admin Routes
- `GET /admin` - Admin dashboard
- `GET /admin/users` - Manage users
- `GET /admin/drivers` - Manage drivers
- `GET /admin/deliveries` - Manage deliveries

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables in project settings
5. Deploy!

Vercel automatically handles PWA deployment and service worker caching.

## Features Implemented

✅ Clerk authentication with automatic user provisioning
✅ Role-based access control (Customer, Driver, Admin)
✅ Prisma ORM with Neon PostgreSQL
✅ Responsive design with Midnight Black/Slate Gray/Gold theme
✅ PWA with offline support
✅ Admin dashboard skeleton
✅ User profile management
✅ Delivery listing and filtering

## Features To Build

- New delivery creation with map selection
- Real-time delivery tracking with WebSocket
- Driver acceptance and pickup/delivery workflow
- Driver profile and verification system
- Delivery reviews and ratings
- Admin management dashboards
- Analytics and reporting
- Payment integration
- Notification system

## Troubleshooting

### Database Connection Error
- Check that `DATABASE_URL` is correct
- Ensure Neon database is running
- Run `npx prisma db push` to sync schema

### Clerk Authentication Issues
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correct
- Check that the app is added to Clerk dashboard
- Clear browser cache and try again

### Webhook Not Working
- Ensure `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- For local development, use ngrok URL
- Check Clerk dashboard logs for webhook errors

## Support

For more information:
- Clerk Docs: https://clerk.com/docs
- Neon Docs: https://neon.tech/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs

## License

This project is created with v0. All rights reserved.
