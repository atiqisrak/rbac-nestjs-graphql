import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private rabbitmqConnection: any = null;
  private rabbitmqChannel: any = null;
  private kafkaProducer: Producer;
  private kafkaConsumer: Consumer;
  private kafka: Kafka;

  constructor(private configService: ConfigService) { }

  async initRabbitMQ() {
    try {
      const url = this.configService.get('rabbitmq.url');
      this.rabbitmqConnection = await amqp.connect(url);
      this.rabbitmqChannel = await this.rabbitmqConnection.createChannel();

      const queue = this.configService.get('rabbitmq.queue');
      await this.rabbitmqChannel.assertQueue(queue, { durable: true });

      this.logger.log('RabbitMQ initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ', error);
    }
  }

  async initKafka() {
    try {
      const brokers = this.configService.get('kafka.brokers');
      const clientId = this.configService.get('kafka.clientId');

      this.kafka = new Kafka({
        clientId,
        brokers,
      });

      this.kafkaProducer = this.kafka.producer();
      await this.kafkaProducer.connect();

      this.logger.log('Kafka initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Kafka', error);
    }
  }

  async publishToRabbitMQ(message: any) {
    if (!this.rabbitmqChannel) {
      this.logger.warn('RabbitMQ not initialized');
      return;
    }

    try {
      const queue = this.configService.get('rabbitmq.queue');
      this.rabbitmqChannel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      this.logger.log(`Message published to RabbitMQ: ${message.event}`);
    } catch (error) {
      this.logger.error('Failed to publish to RabbitMQ', error);
    }
  }

  async publishToKafka(topic: string, message: any) {
    if (!this.kafkaProducer) {
      this.logger.warn('Kafka not initialized');
      return;
    }

    try {
      await this.kafkaProducer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      this.logger.log(`Message published to Kafka topic ${topic}: ${message.event}`);
    } catch (error) {
      this.logger.error('Failed to publish to Kafka', error);
    }
  }

  async publishEvent(event: string, data: any) {
    const message = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    // Publish to both RabbitMQ and Kafka if enabled
    await Promise.all([
      this.publishToRabbitMQ(message),
      this.publishToKafka('rbac-events', message),
    ]);
  }

  async consumeFromRabbitMQ(handler: (message: any) => Promise<void>) {
    if (!this.rabbitmqChannel) {
      this.logger.warn('RabbitMQ not initialized');
      return;
    }

    try {
      const queue = this.configService.get('rabbitmq.queue');
      await this.rabbitmqChannel.consume(queue, async (msg) => {
        if (msg) {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.rabbitmqChannel.ack(msg);
        }
      });
      this.logger.log('Started consuming from RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to consume from RabbitMQ', error);
    }
  }

  async consumeFromKafka(topics: string[], handler: (message: any) => Promise<void>) {
    if (!this.kafka) {
      this.logger.warn('Kafka not initialized');
      return;
    }

    try {
      const groupId = this.configService.get('kafka.groupId');
      this.kafkaConsumer = this.kafka.consumer({ groupId });
      await this.kafkaConsumer.connect();

      await this.kafkaConsumer.subscribe({ topics, fromBeginning: false });

      await this.kafkaConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const content = JSON.parse(message.value.toString());
          await handler(content);
        },
      });

      this.logger.log(`Started consuming from Kafka topics: ${topics.join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to consume from Kafka', error);
    }
  }

  async onModuleDestroy() {
    if (this.rabbitmqChannel) {
      await this.rabbitmqChannel.close();
    }
    if (this.rabbitmqConnection) {
      await this.rabbitmqConnection.close();
    }
    if (this.kafkaProducer) {
      await this.kafkaProducer.disconnect();
    }
    if (this.kafkaConsumer) {
      await this.kafkaConsumer.disconnect();
    }
  }
}

