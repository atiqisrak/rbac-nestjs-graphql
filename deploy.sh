#!/bin/bash

# RBAC Microservice Deployment Script (Without Docker)
# This script sets up and deploys the RBAC service with your PostgreSQL database

set -e  # Exit on any error

echo "🚀 Starting RBAC Microservice Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create a .env file with your configuration."
    exit 1
fi

echo -e "${GREEN}✅ .env file found${NC}"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1/6: Installing dependencies..."
if ! pnpm install; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Generate Prisma Client
echo "🔧 Step 2/6: Generating Prisma Client..."
if ! pnpm prisma:generate; then
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Step 3: Run Database Migrations
echo "🗄️  Step 3/6: Running database migrations..."
if ! pnpm prisma migrate deploy; then
    echo -e "${YELLOW}⚠️  Migration failed. Trying alternative approach...${NC}"
    if ! pnpm prisma db push; then
        echo -e "${RED}❌ Failed to migrate database${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Database migrations completed${NC}"
echo ""

# Step 4: Seed Database (ask user first)
echo "🌱 Step 4/6: Database seeding..."
read -p "Do you want to seed the database with initial data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding database..."
    if pnpm prisma:seed; then
        echo -e "${GREEN}✅ Database seeded successfully${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANT: Save the admin credentials shown above!${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: Seeding failed or data already exists${NC}"
    fi
else
    echo "Skipping database seeding."
fi
echo ""

# Step 5: Build Application
echo "🔨 Step 5/6: Building application..."
if ! pnpm build; then
    echo -e "${RED}❌ Failed to build application${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Application built successfully${NC}"
echo ""

# Step 6: Deployment options
echo "🎯 Step 6/6: Deployment options..."
echo ""
echo "Choose how to start the service:"
echo "  1) Start with pnpm (foreground)"
echo "  2) Start with PM2 (recommended for production)"
echo "  3) Skip (I'll start it manually)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}Starting service with pnpm...${NC}"
        echo "Press Ctrl+C to stop the service"
        echo ""
        pnpm start:prod
        ;;
    2)
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            echo -e "${YELLOW}PM2 is not installed. Installing PM2...${NC}"
            npm install -g pm2
        fi
        
        # Create logs directory
        mkdir -p logs
        
        echo ""
        echo -e "${GREEN}Starting service with PM2...${NC}"
        pm2 start ecosystem.config.js
        pm2 save
        
        echo ""
        echo -e "${GREEN}✅ Service started with PM2${NC}"
        echo ""
        echo "Useful PM2 commands:"
        echo "  pm2 list                  - List all processes"
        echo "  pm2 logs rbac-service     - View logs"
        echo "  pm2 restart rbac-service  - Restart service"
        echo "  pm2 stop rbac-service     - Stop service"
        echo "  pm2 monit                 - Monitor resources"
        echo ""
        echo "To make PM2 start on system boot:"
        echo "  pm2 startup"
        echo ""
        ;;
    3)
        echo ""
        echo "Deployment prepared. You can start the service manually with:"
        echo "  pnpm start:prod"
        echo "or"
        echo "  pm2 start ecosystem.config.js"
        echo ""
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Service should be accessible at:"
echo "  🌐 REST API: http://localhost:3000/api/docs"
echo "  🎮 GraphQL: http://localhost:3000/graphql"
echo ""
echo "Important Next Steps:"
echo "  1. Update JWT secrets in .env (use: openssl rand -base64 32)"
echo "  2. Test the service endpoints"
echo "  3. Configure reverse proxy (Nginx) if needed"
echo "  4. Setup SSL/TLS for production"
echo "  5. Configure firewall rules"
echo ""
echo "For detailed information, see DEPLOYMENT.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

