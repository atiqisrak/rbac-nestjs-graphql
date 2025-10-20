# RBAC NestJS GraphQL Microservice

A production-ready, enterprise-grade Role-Based Access Control (RBAC) microservice built with NestJS, featuring multi-protocol support (GraphQL, REST, gRPC, Message Queue), hierarchical roles, dynamic permissions, and policy-based access control.

## 🚀 Features

- **Authentication & Authorization**

  - JWT-based authentication with access and refresh tokens
  - Password hashing with bcrypt
  - Token refresh mechanism

- **Advanced RBAC**

  - Hierarchical roles with inheritance
  - Dynamic permission management
  - Resource-level permissions
  - Policy-based access control with condition evaluation

- **Multi-Protocol Support**

  - GraphQL API with Apollo Server
  - REST API with Swagger documentation
  - gRPC for high-performance inter-service communication
  - Message Queue (RabbitMQ & Kafka) for event-driven architecture

- **Database**

  - PostgreSQL with Prisma ORM
  - Soft deletes
  - Optimized indexes
  - Database migrations

- **Security**
  - Guards for authentication and authorization
  - Custom decorators for clean code
  - CORS support
  - Validation pipes

## 📋 Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Option 1: Local Development

1. **Clone the repository**

```bash
git clone <repository-url>
cd rbac-nestjs-graphql
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**

```bash
# Start PostgreSQL (or use Docker Compose)
docker-compose up -d postgres

# Run migrations
pnpm prisma:migrate

# Seed the database with default data
pnpm prisma:seed
```

5. **Start the application**

```bash
# Development mode
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

### Option 2: Docker Compose

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec rbac-service pnpm prisma:migrate

# Seed the database
docker-compose exec rbac-service pnpm prisma:seed
```

## 🎮 Usage

### Default Credentials

After seeding the database, an admin user will be created. The credentials are set in `prisma/seed.ts` and will be displayed in the terminal output after running the seed command.

### Access Points

- **GraphQL Playground**: http://localhost:4000/graphql
- **REST API Documentation**: http://localhost:4000/api/docs
- **gRPC Service**: localhost:50051
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## 📚 API Documentation

### GraphQL Examples

#### Register a new user

```graphql
mutation Register {
  register(
    input: {
      email: "user@example.com"
      username: "user"
      password: "Password@123"
      firstName: "John"
      lastName: "Doe"
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

#### Get current user

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

#### Create a role

```graphql
mutation CreateRole {
  createRole(input: { name: "editor", description: "Content editor role" }) {
    id
    name
    description
  }
}
```

#### Create a permission

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

#### Assign role to user

```graphql
mutation AssignRole {
  assignRole(input: { userId: "user-id-here", roleId: "role-id-here" }) {
    id
    email
    username
  }
}
```

#### Check permission

```graphql
query CheckPermission {
  checkPermission(userId: "user-id-here", permissionName: "user:read")
}
```

### REST API Examples

#### Register

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "user",
    "password": "Password@123"
  }'
```

#### Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "your-email@example.com",
    "password": "YourPassword@123"
  }'
```

#### Get all users (requires authentication and permission)

```bash
curl -X GET http://localhost:4000/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### gRPC Examples

```typescript
import { credentials } from "@grpc/grpc-js";
import { loadPackageDefinition } from "@grpc/grpc-js";
import { load } from "@grpc/proto-loader";

const packageDefinition = load("./src/grpc/proto/rbac.proto");
const rbacProto = loadPackageDefinition(packageDefinition);

const client = new rbacProto.rbac.RbacService(
  "localhost:50051",
  credentials.createInsecure()
);

// Authenticate
client.Authenticate(
  {
    usernameOrEmail: "your-email@example.com",
    password: "YourPassword@123",
  },
  (error, response) => {
    if (!error) {
      console.log("Access Token:", response.accessToken);
    }
  }
);

// Check permission
client.CheckPermission(
  {
    userId: "user-id",
    permissionName: "user:read",
  },
  (error, response) => {
    console.log("Has Permission:", response.hasPermission);
  }
);
```

### Message Queue Events

The service publishes events to RabbitMQ and Kafka:

- `user.created`
- `user.updated`
- `user.deleted`
- `role.assigned`
- `role.removed`
- `permission.granted`
- `permission.revoked`
- `resource.permission.granted`
- `resource.permission.revoked`

## 🔐 Authorization

### Using Decorators

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RbacGuard } from './guards';
import { RequirePermission, RequireRole } from './decorators';

@UseGuards(JwtAuthGuard, RbacGuard)
@RequirePermission('user:read')
async getUsers() {
  // Only accessible to users with 'user:read' permission
}

@UseGuards(JwtAuthGuard, RbacGuard)
@RequireRole('admin')
async deleteUser() {
  // Only accessible to users with 'admin' role
}
```

### Public Endpoints

```typescript
import { Public } from './decorators';

@Public()
async publicEndpoint() {
  // Accessible without authentication
}
```

## 🏗️ Architecture

### Database Schema

```
User ←→ UserRole ←→ Role ←→ RolePermission ←→ Permission
                     ↓
                  Role (parent-child hierarchy)

User ←→ ResourcePermission (resource-level access)

Policy ←→ PolicyPermission ←→ Permission
```

### Modules

- **auth**: Authentication and JWT management
- **users**: User management and profile
- **roles**: Role management with hierarchy
- **permissions**: Permission management
- **policies**: Policy-based access control
- **resources**: Resource-level permissions
- **guards**: Authentication and authorization guards
- **decorators**: Custom decorators
- **common**: Shared services and utilities
- **graphql**: GraphQL resolvers
- **rest**: REST controllers
- **grpc**: gRPC controllers
- **messaging**: Message queue services

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## 🚢 Deployment

### Using Docker

```bash
# Build image
docker build -t rbac-service .

# Run container
docker run -p 3000:3000 -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  rbac-service
```

### Using Docker Compose

```bash
docker-compose up -d
```

## 🔧 Configuration

All configuration is managed through environment variables:

| Variable                 | Description                     | Default |
| ------------------------ | ------------------------------- | ------- |
| `PORT`                   | HTTP server port                | 3000    |
| `DATABASE_URL`           | PostgreSQL connection string    | -       |
| `JWT_SECRET`             | JWT signing secret              | -       |
| `JWT_EXPIRES_IN`         | Access token expiration         | 15m     |
| `JWT_REFRESH_SECRET`     | Refresh token secret            | -       |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration        | 7d      |
| `ENABLE_GRAPHQL`         | Enable GraphQL API              | true    |
| `ENABLE_REST`            | Enable REST API                 | true    |
| `ENABLE_GRPC`            | Enable gRPC service             | true    |
| `ENABLE_MESSAGING`       | Enable message queues           | true    |
| `GRPC_PORT`              | gRPC service port               | 5000    |
| `RABBITMQ_URL`           | RabbitMQ connection URL         | -       |
| `KAFKA_BROKERS`          | Kafka brokers (comma-separated) | -       |

## 🤝 Integration Guide

### Integrating with Other Services

#### 1. GraphQL Client (TypeScript)

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

#### 2. REST Client (any language)

```javascript
// JavaScript example
const axios = require("axios");

const rbacClient = axios.create({
  baseURL: "http://localhost:4000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
rbacClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Check permission
const hasPermission = await rbacClient.get("/permissions/check/user-id", {
  params: { permissionName: "user:read" },
});
```

#### 3. gRPC Client

```go
// Go example
package main

import (
    "context"
    "google.golang.org/grpc"
    pb "path/to/generated/rbac"
)

func main() {
    conn, _ := grpc.Dial("localhost:50051", grpc.WithInsecure())
    defer conn.Close()

    client := pb.NewRbacServiceClient(conn)

    // Check permission
    resp, _ := client.CheckPermission(context.Background(), &pb.CheckPermissionRequest{
        UserId: "user-id",
        PermissionName: "user:read",
    })

    fmt.Println("Has Permission:", resp.HasPermission)
}
```

#### 4. Event-Driven Integration

```javascript
// Subscribe to RBAC events
const amqp = require("amqplib");

const connection = await amqp.connect("amqp://localhost:5672");
const channel = await connection.createChannel();

await channel.assertQueue("rbac_queue");

channel.consume("rbac_queue", (msg) => {
  const event = JSON.parse(msg.content.toString());
  console.log("Received event:", event);

  // Handle different events
  switch (event.event) {
    case "user.created":
      // Sync user to your service
      break;
    case "role.assigned":
      // Update user cache
      break;
  }

  channel.ack(msg);
});
```

## 📖 Policy Examples

### Time-based Policy

```json
{
  "type": "time",
  "startTime": "09:00",
  "endTime": "17:00",
  "daysOfWeek": [1, 2, 3, 4, 5]
}
```

### IP-based Policy

```json
{
  "type": "ip",
  "allowedIps": ["192.168.1.100", "10.0.0.50"]
}
```

### Attribute-based Policy

```json
{
  "type": "attribute",
  "attributes": {
    "department": "engineering",
    "level": "senior"
  }
}
```

### Ownership Policy

```json
{
  "type": "ownership",
  "resourceField": "userId"
}
```

### Composite Policy

```json
{
  "type": "composite",
  "operator": "AND",
  "conditions": [
    { "type": "time", "startTime": "09:00", "endTime": "17:00" },
    { "type": "attribute", "attributes": { "department": "engineering" } }
  ]
}
```

## 🤔 FAQ

**Q: Can I use this service with my existing authentication system?**  
A: Yes! You can integrate this as an authorization-only service. Just validate tokens in your existing auth service and forward authorization checks to this service via gRPC or REST.

**Q: How do I add custom permissions for my resources?**  
A: Use the permission creation API with your resource name and action. Example: `blog:publish`, `invoice:approve`.

**Q: Can I disable protocols I don't need?**  
A: Yes! Set the corresponding environment variables to `false` (e.g., `ENABLE_GRPC=false`).

**Q: Is this production-ready?**  
A: Yes! The service includes proper error handling, validation, logging, health checks, and can be deployed with Docker.

## 📄 License

MIT

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on the repository.
