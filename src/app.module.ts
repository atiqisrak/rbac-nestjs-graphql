import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import configuration from './config/configuration';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { PoliciesModule } from './policies/policies.module';
import { ResourcesModule } from './resources/resources.module';
import { MessagingModule } from './messaging/messaging.module';

// Services
import { PrismaService } from './common/prisma.service';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Resolvers
import { AuthResolver } from './graphql/auth.resolver';
import { UsersResolver } from './graphql/users.resolver';
import { RolesResolver } from './graphql/roles.resolver';
import { PermissionsResolver } from './graphql/permissions.resolver';
import { PoliciesResolver } from './graphql/policies.resolver';
import { ResourcesResolver } from './graphql/resources.resolver';

// Controllers
import { AuthController } from './rest/auth.controller';
import { UsersController } from './rest/users.controller';
import { RolesController } from './rest/roles.controller';
import { PermissionsController } from './rest/permissions.controller';
import { PoliciesController } from './rest/policies.controller';
import { ResourcesController } from './rest/resources.controller';

// gRPC
import { RbacGrpcController } from './grpc/rbac.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        playground: configService.get('graphql.playground'),
        debug: configService.get('graphql.debug'),
        context: ({ req, res }) => ({ req, res }),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    PoliciesModule,
    ResourcesModule,
    MessagingModule,
  ],
  controllers: [
    AuthController,
    UsersController,
    RolesController,
    PermissionsController,
    PoliciesController,
    ResourcesController,
    RbacGrpcController,
  ],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    AuthResolver,
    UsersResolver,
    RolesResolver,
    PermissionsResolver,
    PoliciesResolver,
    ResourcesResolver,
  ],
})
export class AppModule {}

