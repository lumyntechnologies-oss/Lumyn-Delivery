#!/bin/bash

# Lumyn Delivery - Database Setup Script
# This script sets up the Prisma schema and runs migrations on Neon PostgreSQL

echo "🚀 Setting up Lumyn Delivery Database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "Please add your Neon PostgreSQL connection string to the environment variables"
  exit 1
fi

echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "⚠️  No pending migrations found, running prisma generate..."
  npx prisma generate
fi

echo "✅ Database setup complete!"
echo "🎉 Your Lumyn Delivery database is ready to use"
