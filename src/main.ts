import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MessagingService } from './messaging/messaging.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS
  app.enableCors({
    origin: configService.get('cors.origin'),
    credentials: true,
  });

  // Swagger documentation (REST API)
  if (configService.get('protocols.rest')) {
    const config = new DocumentBuilder()
      .setTitle('RBAC Microservice API')
      .setDescription('Role-Based Access Control API with multi-protocol support')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication')
      .addTag('Users')
      .addTag('Roles')
      .addTag('Permissions')
      .addTag('Policies')
      .addTag('Resource Permissions')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger documentation available at /api/docs');
  }

  // gRPC microservice
  if (configService.get('protocols.grpc')) {
    const grpcOptions: MicroserviceOptions = {
      transport: Transport.GRPC,
      options: {
        package: 'rbac',
        protoPath: join(__dirname, './grpc/proto/rbac.proto'),
        url: `${configService.get('grpc.host')}:${configService.get('grpc.port')}`,
      },
    };
    app.connectMicroservice(grpcOptions);
    logger.log(
      `gRPC microservice configured on ${configService.get('grpc.host')}:${configService.get('grpc.port')}`,
    );
  }

  // Initialize message queues
  if (configService.get('protocols.messaging')) {
    const messagingService = app.get(MessagingService);
    await messagingService.initRabbitMQ();
    await messagingService.initKafka();
    logger.log('Messaging services initialized (RabbitMQ & Kafka)');
  }

  // Start all microservices
  await app.startAllMicroservices();

  // Start HTTP server
  const port = configService.get('app.port');
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  if (configService.get('protocols.graphql')) {
    logger.log(`🎮 GraphQL Playground: http://localhost:${port}/graphql`);
  }
  if (configService.get('protocols.rest')) {
    logger.log(`📚 REST API Documentation: http://localhost:${port}/api/docs`);
  }
  if (configService.get('protocols.grpc')) {
    logger.log(
      `🔌 gRPC Service: ${configService.get('grpc.host')}:${configService.get('grpc.port')}`,
    );
  }
}

bootstrap();

