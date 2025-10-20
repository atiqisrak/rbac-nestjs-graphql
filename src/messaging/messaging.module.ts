import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { EventsService } from './events.service';

@Module({
  imports: [ConfigModule],
  providers: [MessagingService, EventsService],
  exports: [MessagingService, EventsService],
})
export class MessagingModule {}

