import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  providers: [PoliciesService, PrismaService],
  exports: [PoliciesService],
})
export class PoliciesModule {}

