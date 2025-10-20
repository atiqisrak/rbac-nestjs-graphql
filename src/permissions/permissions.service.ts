import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { resource, action, description } = createPermissionDto;
    const name = `${resource}:${action}`;

    const existing = await this.prisma.permission.findUnique({
      where: { name },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException('Permission already exists');
    }

    return this.prisma.permission.create({
      data: {
        name,
        resource,
        action,
        description,
      },
    });
  }

  async findAll() {
    return this.prisma.permission.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission || permission.deletedAt) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async findByName(name: string) {
    return this.prisma.permission.findUnique({
      where: { name },
    });
  }

  async findByResource(resource: string) {
    return this.prisma.permission.findMany({
      where: {
        resource,
        deletedAt: null,
      },
    });
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    await this.findOne(id);

    const data: any = { ...updatePermissionDto };

    if (updatePermissionDto.resource || updatePermissionDto.action) {
      const permission = await this.findOne(id);
      const resource = updatePermissionDto.resource || permission.resource;
      const action = updatePermissionDto.action || permission.action;
      data.name = `${resource}:${action}`;

      const existing = await this.prisma.permission.findUnique({
        where: { name: data.name },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Permission with this name already exists');
      }
    }

    return this.prisma.permission.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.permission.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async groupByResource() {
    const permissions = await this.findAll();
    const grouped: Record<string, any[]> = {};

    for (const permission of permissions) {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    }

    return grouped;
  }

  async checkPermission(userId: string, permissionName: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    for (const userRole of user.roles) {
      if (userRole.role.permissions) {
        for (const rolePermission of userRole.role.permissions) {
          if (rolePermission.permission.name === permissionName) {
            return true;
          }
        }
      }
    }

    return false;
  }
}

