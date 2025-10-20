# RBAC Microservice - Setup Guide

Complete guide to set up, run, and test the RBAC microservice locally and with Docker.

## Quick Start (Docker - Recommended)

### Prerequisites

- Docker Desktop installed
- Docker Compose installed

### Steps

1. **Clone and navigate to the project**

```bash
cd /Users/atiqisrak/myspace/Aliio/rbac-nestjs-graphql
```

2. **Copy environment file**

```bash
cp .env.example .env
```

3. **Start all services with Docker Compose**

```bash
docker-compose up -d
```

This will start:

- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- RabbitMQ (ports 5672, 15672)
- Kafka + Zookeeper (port 9092)
- RBAC Service (ports 3000, 5000)

4. **Run database migrations**

```bash
docker-compose exec rbac-service pnpm prisma:migrate
```

5. **Seed the database with initial data**

```bash
docker-compose exec rbac-service pnpm prisma:seed
```

6. **Access the services**

- GraphQL Playground: http://localhost:4000/graphql
- REST API Docs: http://localhost:4000/api/docs
- RabbitMQ Management: http://localhost:15672 (guest/guest)

7. **Default Admin Credentials**

The admin credentials are configured in `prisma/seed.ts` and will be displayed in the console output after seeding. Check the terminal for the credentials after running the seed command.

## Local Development Setup

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 16+
- Redis (optional)
- RabbitMQ (optional)
- Kafka (optional)

### Step-by-Step Setup

#### 1. Install Dependencies

```bash
pnpm install
```

#### 2. Setup PostgreSQL Database

**Option A: Using Docker**

```bash
docker run -d \
  --name rbac-postgres \
  -e POSTGRES_USER=rbac_user \
  -e POSTGRES_PASSWORD=rbac_password \
  -e POSTGRES_DB=rbac_db \
  -p 5432:5432 \
  postgres:16-alpine
```

**Option B: Local PostgreSQL**

```bash
# Create database
createdb rbac_db

# Or using psql
psql -U postgres
CREATE DATABASE rbac_db;
CREATE USER rbac_user WITH PASSWORD 'rbac_password';
GRANT ALL PRIVILEGES ON DATABASE rbac_db TO rbac_user;
\q
```

#### 3. Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://rbac_user:rbac_password@localhost:5432/rbac_db?schema=public"

# JWT (Change these in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_REFRESH_EXPIRES_IN=7d

# Enable/Disable Protocols
ENABLE_GRAPHQL=true
ENABLE_REST=true
ENABLE_GRPC=false
ENABLE_MESSAGING=false

# GraphQL
GRAPHQL_PLAYGROUND=true
GRAPHQL_DEBUG=true
```

#### 4. Generate Prisma Client

```bash
pnpm prisma:generate
```

#### 5. Run Database Migrations

```bash
pnpm prisma:migrate
```

#### 6. Seed Database with Initial Data

```bash
pnpm prisma:seed
```

This creates:

- Default admin user (credentials shown in terminal output)
- Basic roles (admin, manager, user)
- Common permissions (user:_, role:_, permission:\*, etc.)
- Sample policy (business-hours-only)

#### 7. Start the Development Server

```bash
pnpm start:dev
```

The server will start on http://localhost:4000

## Optional Services Setup

### Redis (For Caching)

```bash
docker run -d \
  --name rbac-redis \
  -p 6379:6379 \
  redis:7-alpine
```

Update `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### RabbitMQ (For Message Queue)

```bash
docker run -d \
  --name rbac-rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management-alpine
```

Update `.env`:

```env
ENABLE_MESSAGING=true
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=rbac_queue
```

### Kafka (For Event Streaming)

```bash
# Start Zookeeper
docker run -d \
  --name rbac-zookeeper \
  -p 2181:2181 \
  -e ZOOKEEPER_CLIENT_PORT=2181 \
  confluentinc/cp-zookeeper:latest

# Start Kafka
docker run -d \
  --name rbac-kafka \
  -p 9092:9092 \
  -e KAFKA_ZOOKEEPER_CONNECT=localhost:2181 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  confluentinc/cp-kafka:latest
```

Update `.env`:

```env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=rbac-service
KAFKA_GROUP_ID=rbac-group
```

## Testing the Service

### 1. Test GraphQL API

Open GraphQL Playground: http://localhost:4000/graphql

#### Login

```graphql
mutation Login {
  login(
    input: {
      usernameOrEmail: "your-email@example.com"
      password: "YourPassword@123"
    }
  ) {
    accessToken
    refreshToken
    userId
    email
    username
  }
}
```

Copy the `accessToken` from the response.

#### Set Authorization Header

In GraphQL Playground, click "HTTP HEADERS" at the bottom and add:

```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}
```

#### Get Current User

```graphql
query Me {
  me {
    id
    email
    username
    firstName
    lastName
    isActive
  }
}
```

#### Get All Users

```graphql
query GetUsers {
  users {
    id
    email
    username
    firstName
    lastName
    isActive
  }
}
```

#### Register New User

```graphql
mutation Register {
  register(
    input: {
      email: "john@example.com"
      username: "john"
      password: "Password@123"
      firstName: "John"
      lastName: "Doe"
    }
  ) {
    accessToken
    refreshToken
    userId
    email
  }
}
```

#### Create Role

```graphql
mutation CreateRole {
  createRole(
    input: {
      name: "editor"
      description: "Content editor with limited permissions"
    }
  ) {
    id
    name
    description
  }
}
```

#### Create Permission

```graphql
mutation CreatePermission {
  createPermission(
    input: {
      resource: "post"
      action: "create"
      description: "Create blog posts"
    }
  ) {
    id
    name
    resource
    action
  }
}
```

#### Assign Role to User

```graphql
mutation AssignRole {
  assignRole(input: { userId: "USER_ID_HERE", roleId: "ROLE_ID_HERE" }) {
    id
    email
  }
}
```

### 2. Test REST API

Access Swagger Documentation: http://localhost:4000/api/docs

#### Login with cURL

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "your-email@example.com",
    "password": "YourPassword@123"
  }'
```

Save the `accessToken` from the response.

#### Get Current User

```bash
curl -X GET http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get All Users

```bash
curl -X GET http://localhost:4000/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Check Permission

```bash
curl -X GET "http://localhost:4000/permissions/check/USER_ID?permissionName=user:read" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get User Roles

```bash
curl -X GET http://localhost:4000/users/USER_ID/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Test with Postman

1. **Import Collection**

   - Create a new Postman collection
   - Set base URL: `http://localhost:4000`

2. **Setup Environment Variables**

   - Create environment with:
     - `baseUrl`: http://localhost:4000
     - `accessToken`: (will be set after login)

3. **Login Request**

   ```
   POST {{baseUrl}}/auth/login
   Headers: Content-Type: application/json
   Body (JSON):
   {
     "usernameOrEmail": "your-email@example.com",
     "password": "YourPassword@123"
   }
   ```

4. **Auto-save Token (Tests Tab)**

   ```javascript
   const response = pm.response.json();
   pm.environment.set("accessToken", response.accessToken);
   ```

5. **Protected Requests**
   Add to Headers:
   ```
   Authorization: Bearer {{accessToken}}
   ```

### 4. Test gRPC (if enabled)

Install grpcurl:

```bash
brew install grpcurl  # macOS
```

#### Authenticate

```bash
grpcurl -plaintext -d '{
  "usernameOrEmail": "your-email@example.com",
  "password": "YourPassword@123"
}' localhost:50051 rbac.RbacService/Authenticate
```

#### Check Permission

```bash
grpcurl -plaintext -d '{
  "userId": "USER_ID",
  "permissionName": "user:read"
}' localhost:50051 rbac.RbacService/CheckPermission
```

## Common Issues & Solutions

### Issue: Database Connection Error

```
Error: Can't reach database server
```

**Solution:**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Or for local PostgreSQL
psql -U rbac_user -d rbac_db -c "SELECT 1"

# Verify DATABASE_URL in .env is correct
```

### Issue: Port Already in Use

```
Error: Port 3000 is already in use
```

**Solution:**

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 PID

# Or change PORT in .env
PORT=3001
```

### Issue: Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Solution:**

```bash
pnpm prisma:generate
```

### Issue: Migration Failed

```
Error: Migration engine failed
```

**Solution:**

```bash
# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Or create new migration
pnpm prisma migrate dev --name init
```

### Issue: bcrypt Build Error

```
Error: Cannot find module 'bcrypt'
```

**Solution:**

```bash
# Rebuild bcrypt
pnpm rebuild bcrypt

# Or reinstall
pnpm remove bcrypt
pnpm add bcrypt
```

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000

# Use strong, random secrets
JWT_SECRET=<generate-with: openssl rand -base64 32>
JWT_REFRESH_SECRET=<generate-with: openssl rand -base64 32>

# Production database
DATABASE_URL="postgresql://user:password@prod-host:5432/rbac_db?schema=public"

# Disable debug features
GRAPHQL_PLAYGROUND=false
GRAPHQL_DEBUG=false

# Production CORS
CORS_ORIGIN=https://your-domain.com,https://api.your-domain.com
```

### Build for Production

```bash
# Build the application
pnpm build

# Run migrations
pnpm prisma:migrate deploy

# Start production server
pnpm start:prod
```

### Using Docker

```bash
# Build image
docker build -t rbac-service:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  --name rbac-service \
  rbac-service:latest
```

## Health Check

The service includes health check endpoints:

```bash
# HTTP Health Check
curl http://localhost:4000/auth/me

# Expected response for unauthenticated: 401
# This means the service is running
```

## Database Management

### View Database with Prisma Studio

```bash
pnpm prisma:studio
```

Access at: http://localhost:5555

### Create New Migration

```bash
pnpm prisma migrate dev --name your_migration_name
```

### Reset Database (Development Only)

```bash
pnpm prisma migrate reset
```

### Generate Prisma Client

```bash
pnpm prisma:generate
```

## Testing

### Run Unit Tests

```bash
pnpm test
```

### Run E2E Tests

```bash
pnpm test:e2e
```

### Run Tests with Coverage

```bash
pnpm test:cov
```

## Monitoring

### View Logs

```bash
# Docker
docker-compose logs -f rbac-service

# Local
# Logs appear in console when running pnpm start:dev
```

### RabbitMQ Management UI

- URL: http://localhost:15672
- Username: guest
- Password: guest

View queues, exchanges, and message rates.

## Next Steps

1. **Customize Permissions**: Add permissions specific to your application
2. **Create Roles**: Define roles that match your application's needs
3. **Integrate with Your Services**: Use the integration guide (INTEGRATION.md)
4. **Set up Production Database**: Configure production PostgreSQL
5. **Configure SSL/TLS**: Add HTTPS in production
6. **Set up Monitoring**: Add logging and metrics (e.g., Prometheus, Grafana)
7. **Add Rate Limiting**: Protect against abuse
8. **Configure Backup**: Set up database backups

## Support

For issues and questions:

- Check the README.md for documentation
- Review INTEGRATION.md for integration examples
- Open an issue on the repository

## Useful Commands Reference

```bash
# Development
pnpm start:dev              # Start development server
pnpm build                  # Build for production
pnpm start:prod             # Start production server

# Database
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate         # Run migrations
pnpm prisma:studio          # Open Prisma Studio
pnpm prisma:seed            # Seed database

# Testing
pnpm test                   # Run unit tests
pnpm test:e2e               # Run E2E tests
pnpm test:cov               # Test coverage

# Docker
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs -f      # View logs
docker-compose ps           # List running containers
```
