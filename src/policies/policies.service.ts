import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PolicyEffect } from '@prisma/client';

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  async create(createPolicyDto: CreatePolicyDto) {
    const { name, description, effect, conditions } = createPolicyDto;

    const existing = await this.prisma.policy.findUnique({
      where: { name },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException('Policy already exists');
    }

    // Validate JSON conditions
    try {
      JSON.parse(conditions);
    } catch (error) {
      throw new ConflictException('Invalid JSON format for conditions');
    }

    return this.prisma.policy.create({
      data: {
        name,
        description,
        effect,
        conditions: JSON.parse(conditions),
      },
    });
  }

  async findAll() {
    return this.prisma.policy.findMany({
      where: { deletedAt: null },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!policy || policy.deletedAt) {
      throw new NotFoundException('Policy not found');
    }

    return policy;
  }

  async findByName(name: string) {
    return this.prisma.policy.findUnique({
      where: { name },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto) {
    await this.findOne(id);

    if (updatePolicyDto.name) {
      const existing = await this.prisma.policy.findUnique({
        where: { name: updatePolicyDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Policy with this name already exists');
      }
    }

    const data: any = { ...updatePolicyDto };

    if (updatePolicyDto.conditions) {
      try {
        data.conditions = JSON.parse(updatePolicyDto.conditions);
      } catch (error) {
        throw new ConflictException('Invalid JSON format for conditions');
      }
    }

    return this.prisma.policy.update({
      where: { id },
      data,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.policy.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async evaluatePolicy(
    policyName: string,
    user: any,
    context: any,
  ): Promise<boolean> {
    const policy = await this.findByName(policyName);

    if (!policy || !policy.isActive) {
      return false;
    }

    const conditions = policy.conditions as any;
    const result = this.evaluateConditions(conditions, user, context);

    // If effect is DENY and conditions match, deny access
    if (policy.effect === PolicyEffect.DENY && result) {
      return false;
    }

    // If effect is ALLOW and conditions match, allow access
    if (policy.effect === PolicyEffect.ALLOW && result) {
      return true;
    }

    return false;
  }

  private evaluateConditions(
    conditions: any,
    user: any,
    context: any,
  ): boolean {
    if (!conditions) {
      return true;
    }

    // Handle different condition types
    if (conditions.type === 'time') {
      return this.evaluateTimeCondition(conditions);
    }

    if (conditions.type === 'ip') {
      return this.evaluateIpCondition(conditions, context);
    }

    if (conditions.type === 'attribute') {
      return this.evaluateAttributeCondition(conditions, user);
    }

    if (conditions.type === 'ownership') {
      return this.evaluateOwnershipCondition(conditions, user, context);
    }

    if (conditions.type === 'composite') {
      return this.evaluateCompositeCondition(conditions, user, context);
    }

    // Default: check if user has required attributes
    if (conditions.userId && user.id !== conditions.userId) {
      return false;
    }

    return true;
  }

  private evaluateTimeCondition(conditions: any): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (conditions.startTime && conditions.endTime) {
      const [startHour, startMin] = conditions.startTime.split(':').map(Number);
      const [endHour, endMin] = conditions.endTime.split(':').map(Number);
      const start = startHour * 60 + startMin;
      const end = endHour * 60 + endMin;

      return currentTime >= start && currentTime <= end;
    }

    if (conditions.daysOfWeek) {
      const currentDay = now.getDay();
      return conditions.daysOfWeek.includes(currentDay);
    }

    return true;
  }

  private evaluateIpCondition(conditions: any, context: any): boolean {
    if (!conditions.allowedIps || !context.ip) {
      return true;
    }

    return conditions.allowedIps.includes(context.ip);
  }

  private evaluateAttributeCondition(conditions: any, user: any): boolean {
    if (!conditions.attributes) {
      return true;
    }

    for (const [key, value] of Object.entries(conditions.attributes)) {
      if (user[key] !== value) {
        return false;
      }
    }

    return true;
  }

  private evaluateOwnershipCondition(
    conditions: any,
    user: any,
    context: any,
  ): boolean {
    if (!conditions.resourceField) {
      return false;
    }

    const resource = context.body || context.params || {};
    const ownerId = resource[conditions.resourceField];

    return ownerId === user.id;
  }

  private evaluateCompositeCondition(
    conditions: any,
    user: any,
    context: any,
  ): boolean {
    if (conditions.operator === 'AND') {
      return conditions.conditions.every((cond: any) =>
        this.evaluateConditions(cond, user, context),
      );
    }

    if (conditions.operator === 'OR') {
      return conditions.conditions.some((cond: any) =>
        this.evaluateConditions(cond, user, context),
      );
    }

    if (conditions.operator === 'NOT') {
      return !this.evaluateConditions(conditions.condition, user, context);
    }

    return true;
  }
}

