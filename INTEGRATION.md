# Integration Guide

This guide provides detailed examples of how to integrate the RBAC microservice with your applications.

## Table of Contents

1. [GraphQL Integration](#graphql-integration)
2. [REST API Integration](#rest-api-integration)
3. [gRPC Integration](#grpc-integration)
4. [Event-Driven Integration](#event-driven-integration)
5. [Client SDK](#client-sdk)

## GraphQL Integration

### React + Apollo Client

```typescript
// apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri:
    process.env.REACT_APP_RBAC_GRAPHQL_URL || "http://localhost:4000/graphql",
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

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// hooks/useAuth.ts
import { gql, useMutation } from "@apollo/client";

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginDto!) {
    login(input: $input) {
      accessToken
      refreshToken
      userId
      email
      username
    }
  }
`;

export const useAuth = () => {
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION);

  const handleLogin = async (usernameOrEmail: string, password: string) => {
    const { data } = await login({
      variables: {
        input: { usernameOrEmail, password },
      },
    });

    localStorage.setItem("accessToken", data.login.accessToken);
    localStorage.setItem("refreshToken", data.login.refreshToken);

    return data.login;
  };

  return { login: handleLogin, loading, error };
};

// hooks/usePermission.ts
import { gql, useQuery } from "@apollo/client";

const CHECK_PERMISSION = gql`
  query CheckPermission($userId: String!, $permissionName: String!) {
    checkPermission(userId: $userId, permissionName: $permissionName)
  }
`;

export const usePermission = (userId: string, permissionName: string) => {
  const { data, loading } = useQuery(CHECK_PERMISSION, {
    variables: { userId, permissionName },
    skip: !userId || !permissionName,
  });

  return {
    hasPermission: data?.checkPermission || false,
    loading,
  };
};

// components/ProtectedComponent.tsx
import { usePermission } from "../hooks/usePermission";

export const ProtectedComponent = ({
  userId,
  requiredPermission,
  children,
}) => {
  const { hasPermission, loading } = usePermission(userId, requiredPermission);

  if (loading) return <div>Checking permissions...</div>;
  if (!hasPermission) return <div>Access Denied</div>;

  return <>{children}</>;
};
```

### Vue + Apollo Client

```typescript
// apollo.config.ts
import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from "@apollo/client/core";
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

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

// composables/useRbac.ts
import { useMutation, useQuery } from "@vue/apollo-composable";
import gql from "graphql-tag";

export function useRbac() {
  const loginMutation = gql`
    mutation Login($input: LoginDto!) {
      login(input: $input) {
        accessToken
        refreshToken
        userId
      }
    }
  `;

  const { mutate: login } = useMutation(loginMutation);

  const checkPermission = (userId: string, permissionName: string) => {
    return useQuery(
      gql`
        query CheckPermission($userId: String!, $permissionName: String!) {
          checkPermission(userId: $userId, permissionName: $permissionName)
        }
      `,
      { userId, permissionName }
    );
  };

  return { login, checkPermission };
}
```

## REST API Integration

### JavaScript/TypeScript

```typescript
// rbac-client.ts
import axios, { AxiosInstance } from "axios";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  username: string;
}

export class RbacClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string = "http://localhost:4000") {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.refreshToken) {
          await this.refresh();
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  async login(
    usernameOrEmail: string,
    password: string
  ): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>("/auth/login", {
      usernameOrEmail,
      password,
    });

    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;

    return data;
  }

  async register(
    email: string,
    username: string,
    password: string
  ): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>("/auth/register", {
      email,
      username,
      password,
    });

    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;

    return data;
  }

  async refresh(): Promise<void> {
    const { data } = await this.client.post<AuthResponse>(
      "/auth/refresh",
      {},
      {
        headers: { Authorization: `Bearer ${this.refreshToken}` },
      }
    );

    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
  }

  async checkPermission(
    userId: string,
    permissionName: string
  ): Promise<boolean> {
    const { data } = await this.client.get(`/permissions/check/${userId}`, {
      params: { permissionName },
    });
    return data;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const { data } = await this.client.get(`/users/${userId}/roles`);
    return data;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const { data } = await this.client.get(`/users/${userId}/permissions`);
    return data;
  }

  async checkResourceAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<boolean> {
    const { data } = await this.client.post("/resources/check-access", {
      userId,
      resourceType,
      resourceId,
      action,
    });
    return data;
  }

  setToken(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }
}

// Usage
const rbac = new RbacClient("http://localhost:4000");

// Login
const auth = await rbac.login("your-email@example.com", "YourPassword@123");
console.log("Logged in:", auth.userId);

// Check permission
const canRead = await rbac.checkPermission(auth.userId, "user:read");
console.log("Can read users:", canRead);

// Get user roles
const roles = await rbac.getUserRoles(auth.userId);
console.log("User roles:", roles);
```

### Python

```python
# rbac_client.py
import requests
from typing import Optional, List, Dict

class RbacClient:
    def __init__(self, base_url: str = "http://localhost:4000"):
        self.base_url = base_url
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.session = requests.Session()

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers

    def login(self, username_or_email: str, password: str) -> Dict:
        response = self.session.post(
            f"{self.base_url}/auth/login",
            json={"usernameOrEmail": username_or_email, "password": password},
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        data = response.json()

        self.access_token = data["accessToken"]
        self.refresh_token = data["refreshToken"]

        return data

    def check_permission(self, user_id: str, permission_name: str) -> bool:
        response = self.session.get(
            f"{self.base_url}/permissions/check/{user_id}",
            params={"permissionName": permission_name},
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()

    def get_user_roles(self, user_id: str) -> List[str]:
        response = self.session.get(
            f"{self.base_url}/users/{user_id}/roles",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()

    def get_user_permissions(self, user_id: str) -> List[str]:
        response = self.session.get(
            f"{self.base_url}/users/{user_id}/permissions",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()

# Usage
rbac = RbacClient()
auth = rbac.login("your-email@example.com", "YourPassword@123")
print(f"Logged in: {auth['userId']}")

can_read = rbac.check_permission(auth['userId'], "user:read")
print(f"Can read users: {can_read}")
```

## gRPC Integration

### Node.js

```typescript
// grpc-client.ts
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { promisify } from "util";

const PROTO_PATH = "./rbac.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const rbacProto: any = grpc.loadPackageDefinition(packageDefinition).rbac;

export class RbacGrpcClient {
  private client: any;

  constructor(address: string = "localhost:50051") {
    this.client = new rbacProto.RbacService(
      address,
      grpc.credentials.createInsecure()
    );
  }

  async authenticate(usernameOrEmail: string, password: string) {
    const authenticate = promisify(this.client.Authenticate.bind(this.client));
    return await authenticate({ usernameOrEmail, password });
  }

  async checkPermission(
    userId: string,
    permissionName: string
  ): Promise<boolean> {
    const checkPermission = promisify(
      this.client.CheckPermission.bind(this.client)
    );
    const result = await checkPermission({ userId, permissionName });
    return result.hasPermission;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const getUserRoles = promisify(this.client.GetUserRoles.bind(this.client));
    const result = await getUserRoles({ userId });
    return result.roles;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const getUserPermissions = promisify(
      this.client.GetUserPermissions.bind(this.client)
    );
    const result = await getUserPermissions({ userId });
    return result.permissions;
  }

  async checkResourceAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<boolean> {
    const checkResourceAccess = promisify(
      this.client.CheckResourceAccess.bind(this.client)
    );
    const result = await checkResourceAccess({
      userId,
      resourceType,
      resourceId,
      action,
    });
    return result.hasAccess;
  }
}

// Usage
const client = new RbacGrpcClient("localhost:50051");

const auth = await client.authenticate("your-email@example.com", "YourPassword@123");
console.log("Access Token:", auth.accessToken);

const hasPermission = await client.checkPermission(auth.userId, "user:read");
console.log("Has Permission:", hasPermission);
```

### Go

```go
package main

import (
    "context"
    "log"
    "google.golang.org/grpc"
    pb "your-module/rbac" // Generated proto files
)

type RbacClient struct {
    client pb.RbacServiceClient
    conn   *grpc.ClientConn
}

func NewRbacClient(address string) (*RbacClient, error) {
    conn, err := grpc.Dial(address, grpc.WithInsecure())
    if err != nil {
        return nil, err
    }

    client := pb.NewRbacServiceClient(conn)

    return &RbacClient{
        client: client,
        conn:   conn,
    }, nil
}

func (c *RbacClient) Close() error {
    return c.conn.Close()
}

func (c *RbacClient) Authenticate(usernameOrEmail, password string) (*pb.AuthResponse, error) {
    return c.client.Authenticate(context.Background(), &pb.AuthRequest{
        UsernameOrEmail: usernameOrEmail,
        Password:        password,
    })
}

func (c *RbacClient) CheckPermission(userId, permissionName string) (bool, error) {
    resp, err := c.client.CheckPermission(context.Background(), &pb.CheckPermissionRequest{
        UserId:         userId,
        PermissionName: permissionName,
    })
    if err != nil {
        return false, err
    }
    return resp.HasPermission, nil
}

func main() {
    client, err := NewRbacClient("localhost:50051")
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    // Authenticate
    auth, err := client.Authenticate("your-email@example.com", "YourPassword@123")
    if err != nil {
        log.Fatal(err)
    }
    log.Println("Access Token:", auth.AccessToken)

    // Check permission
    hasPermission, err := client.CheckPermission(auth.UserId, "user:read")
    if err != nil {
        log.Fatal(err)
    }
    log.Println("Has Permission:", hasPermission)
}
```

## Event-Driven Integration

### RabbitMQ Consumer (Node.js)

```typescript
import amqp from "amqplib";

async function consumeRbacEvents() {
  const connection = await amqp.connect("amqp://localhost:5672");
  const channel = await connection.createChannel();

  const queue = "rbac_queue";
  await channel.assertQueue(queue, { durable: true });

  console.log("Waiting for RBAC events...");

  channel.consume(queue, (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      console.log("Received event:", event);

      switch (event.event) {
        case "user.created":
          handleUserCreated(event.data);
          break;
        case "role.assigned":
          handleRoleAssigned(event.data);
          break;
        case "permission.granted":
          handlePermissionGranted(event.data);
          break;
        default:
          console.log("Unknown event type:", event.event);
      }

      channel.ack(msg);
    }
  });
}

function handleUserCreated(data: any) {
  console.log("New user created:", data.userId);
  // Sync user to your service database
  // Create corresponding resources
}

function handleRoleAssigned(data: any) {
  console.log("Role assigned:", data);
  // Update user cache
  // Notify relevant services
}

function handlePermissionGranted(data: any) {
  console.log("Permission granted:", data);
  // Invalidate permission cache
  // Update ACLs
}

consumeRbacEvents();
```

### Kafka Consumer (Node.js)

```typescript
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "my-service",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "my-service-group" });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: "rbac-events", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());

      console.log({
        topic,
        partition,
        offset: message.offset,
        event: event.event,
        data: event.data,
      });

      // Handle events
      switch (event.event) {
        case "user.created":
          await syncUserToDatabase(event.data);
          break;
        case "role.assigned":
          await updateUserPermissionsCache(event.data);
          break;
      }
    },
  });
}

run().catch(console.error);
```

## Middleware Examples

### Express Middleware

```typescript
import { RbacClient } from "./rbac-client";

const rbac = new RbacClient("http://localhost:4000");

export const requirePermission = (permissionName: string) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const hasPermission = await rbac.checkPermission(userId, permissionName);

      if (!hasPermission) {
        return res.status(403).json({ error: "Forbidden" });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

// Usage
app.get("/users", requirePermission("user:read"), (req, res) => {
  // Handler
});
```

### NestJS Guard

```typescript
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { RbacClient } from "./rbac-client";

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private rbac: RbacClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredPermission = this.getRequiredPermission(context);

    if (!requiredPermission) {
      return true;
    }

    return await this.rbac.checkPermission(user.id, requiredPermission);
  }

  private getRequiredPermission(context: ExecutionContext): string | null {
    const handler = context.getHandler();
    return Reflect.getMetadata("permission", handler);
  }
}
```

This integration guide provides comprehensive examples for integrating the RBAC microservice with various technologies and platforms.
