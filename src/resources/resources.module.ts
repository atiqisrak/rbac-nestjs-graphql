import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  providers: [ResourcesService, PrismaService],
  exports: [ResourcesService],
})
export class ResourcesModule {}

