import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GrantResourcePermissionDto } from './dto/grant-resource-permission.dto';
import { CheckResourceAccessDto } from './dto/check-resource-access.dto';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async grantPermission(grantDto: GrantResourcePermissionDto) {
    const { userId, resourceType, resourceId, actions } = grantDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.resourcePermission.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType,
          resourceId,
        },
      },
    });

    if (existing) {
      return this.prisma.resourcePermission.update({
        where: { id: existing.id },
        data: { actions },
      });
    }

    return this.prisma.resourcePermission.create({
      data: {
        userId,
        resourceType,
        resourceId,
        actions,
      },
    });
  }

  async revokePermission(userId: string, resourceType: string, resourceId: string) {
    const permission = await this.prisma.resourcePermission.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType,
          resourceId,
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Resource permission not found');
    }

    return this.prisma.resourcePermission.delete({
      where: { id: permission.id },
    });
  }

  async updateActions(
    userId: string,
    resourceType: string,
    resourceId: string,
    actions: string[],
  ) {
    const permission = await this.prisma.resourcePermission.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType,
          resourceId,
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Resource permission not found');
    }

    return this.prisma.resourcePermission.update({
      where: { id: permission.id },
      data: { actions },
    });
  }

  async checkAccess(checkDto: CheckResourceAccessDto): Promise<boolean> {
    const { userId, resourceType, resourceId, action } = checkDto;

    const permission = await this.prisma.resourcePermission.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId,
          resourceType,
          resourceId,
        },
      },
    });

    if (!permission || permission.deletedAt) {
      return false;
    }

    return permission.actions.includes(action);
  }

  async getUserResourcePermissions(
    userId: string,
    resourceType?: string,
  ) {
    const where: any = {
      userId,
      deletedAt: null,
    };

    if (resourceType) {
      where.resourceType = resourceType;
    }

    return this.prisma.resourcePermission.findMany({
      where,
    });
  }

  async getResourcePermissions(resourceType: string, resourceId: string) {
    return this.prisma.resourcePermission.findMany({
      where: {
        resourceType,
        resourceId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async delegatePermission(
    fromUserId: string,
    toUserId: string,
    resourceType: string,
    resourceId: string,
    actions: string[],
  ) {
    // Check if fromUser has the permissions to delegate
    const fromUserPermission = await this.prisma.resourcePermission.findUnique({
      where: {
        userId_resourceType_resourceId: {
          userId: fromUserId,
          resourceType,
          resourceId,
        },
      },
    });

    if (!fromUserPermission) {
      throw new NotFoundException('You do not have permissions to delegate');
    }

    // Check if all actions are available to delegate
    const unavailableActions = actions.filter(
      (action) => !fromUserPermission.actions.includes(action),
    );

    if (unavailableActions.length > 0) {
      throw new ConflictException(
        `You cannot delegate actions: ${unavailableActions.join(', ')}`,
      );
    }

    // Grant permissions to toUser
    return this.grantPermission({
      userId: toUserId,
      resourceType,
      resourceId,
      actions,
    });
  }
}

