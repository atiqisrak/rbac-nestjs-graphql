#!/bin/bash

# RBAC Microservice Setup Script
# This script automates the setup process for the RBAC microservice

set -e

echo "🚀 RBAC Microservice Setup"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed${NC}"
    echo "Please install pnpm: npm install -g pnpm"
    exit 1
fi
echo -e "${GREEN}✅ pnpm is installed${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not running${NC}"
    echo "Please start Docker Desktop and run this script again"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Ask user for setup type
echo ""
echo "Choose setup type:"
echo "1) Full setup with Docker Compose (PostgreSQL, Redis, RabbitMQ, Kafka)"
echo "2) Minimal setup (PostgreSQL only via Docker)"
echo "3) Local development (assumes PostgreSQL is already running)"
read -p "Enter choice [1-3]: " setup_choice

case $setup_choice in
    1)
        echo ""
        echo "🐳 Starting all services with Docker Compose..."
        docker-compose up -d
        
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 10
        
        echo ""
        echo "📊 Generating Prisma client..."
        pnpm prisma:generate
        
        echo ""
        echo "🗄️  Running database migrations..."
        docker-compose exec -T rbac-service pnpm prisma:migrate || {
            echo "Running migrations from host..."
            pnpm prisma migrate dev --name init
        }
        
        echo ""
        echo "🌱 Seeding database..."
        docker-compose exec -T rbac-service pnpm prisma:seed || {
            echo "Running seed from host..."
            pnpm prisma:seed
        }
        
        echo ""
        echo -e "${GREEN}✅ Full setup completed!${NC}"
        echo ""
        echo "Services:"
        echo "  - RBAC Service: http://localhost:4000"
        echo "  - GraphQL: http://localhost:4000/graphql"
        echo "  - REST API Docs: http://localhost:4000/api/docs"
        echo "  - RabbitMQ Management: http://localhost:15672"
        echo ""
        echo "Default credentials:"
        echo "  Email: (set during seed)"
        echo "  Password: (set during seed)"
        ;;
        
    2)
        echo ""
        echo "🐳 Starting PostgreSQL with Docker..."
        docker run -d \
            --name rbac-postgres \
            -e POSTGRES_USER=rbac_user \
            -e POSTGRES_PASSWORD=rbac_password \
            -e POSTGRES_DB=rbac_db \
            -p 5432:5432 \
            postgres:16-alpine || echo "Container already exists"
        
        echo ""
        echo "⏳ Waiting for PostgreSQL to be ready..."
        sleep 5
        
        echo ""
        echo "📊 Generating Prisma client..."
        pnpm prisma:generate
        
        echo ""
        echo "🗄️  Running database migrations..."
        pnpm prisma migrate dev --name init
        
        echo ""
        echo "🌱 Seeding database..."
        pnpm prisma:seed
        
        echo ""
        echo -e "${GREEN}✅ Minimal setup completed!${NC}"
        echo ""
        echo "Start the development server:"
        echo "  pnpm start:dev"
        echo ""
        echo "Access points:"
        echo "  - GraphQL: http://localhost:4000/graphql"
        echo "  - REST API Docs: http://localhost:4000/api/docs"
        echo ""
        echo "Default credentials:"
        echo "  Email: (set during seed)"
        echo "  Password: (set during seed)"
        ;;
        
    3)
        echo ""
        echo "📊 Generating Prisma client..."
        pnpm prisma:generate
        
        echo ""
        echo "🗄️  Running database migrations..."
        pnpm prisma migrate dev --name init
        
        echo ""
        echo "🌱 Seeding database..."
        pnpm prisma:seed
        
        echo ""
        echo -e "${GREEN}✅ Local setup completed!${NC}"
        echo ""
        echo "Start the development server:"
        echo "  pnpm start:dev"
        echo ""
        echo "Access points:"
        echo "  - GraphQL: http://localhost:4000/graphql"
        echo "  - REST API Docs: http://localhost:4000/api/docs"
        echo ""
        echo "Default credentials:"
        echo "  Email: (set during seed)"
        echo "  Password: (set during seed)"
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "📚 Next steps:"
echo "  1. Review SETUP.md for detailed documentation"
echo "  2. Check INTEGRATION.md for integration examples"
echo "  3. Start building your application!"

