import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const { name, description, parentId } = createRoleDto;

    const existing = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException('Role with this name already exists');
    }

    if (parentId) {
      const parentRole = await this.prisma.role.findUnique({
        where: { id: parentId },
      });
      if (!parentRole) {
        throw new NotFoundException('Parent role not found');
      }
    }

    return this.prisma.role.create({
      data: {
        name,
        description,
        parentId,
      },
      include: {
        parent: true,
        children: true,
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      where: { deletedAt: null },
      include: {
        parent: true,
        children: true,
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!role || role.deletedAt) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async findByName(name: string) {
    return this.prisma.role.findUnique({
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

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    await this.findOne(id);

    if (updateRoleDto.name) {
      const existing = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    if (updateRoleDto.parentId) {
      if (updateRoleDto.parentId === id) {
        throw new BadRequestException('Role cannot be its own parent');
      }
      const parentRole = await this.prisma.role.findUnique({
        where: { id: updateRoleDto.parentId },
      });
      if (!parentRole) {
        throw new NotFoundException('Parent role not found');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
      include: {
        parent: true,
        children: true,
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

    const childRoles = await this.prisma.role.findMany({
      where: { parentId: id },
    });

    if (childRoles.length > 0) {
      throw new BadRequestException(
        'Cannot delete role with child roles. Delete or reassign child roles first.',
      );
    }

    return this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async assignPermission(assignPermissionDto: AssignPermissionDto) {
    const { roleId, permissionId } = assignPermissionDto;

    const role = await this.findOne(roleId);
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Role already has this permission');
    }

    await this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });

    return this.findOne(roleId);
  }

  async removePermission(roleId: string, permissionId: string) {
    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    return this.findOne(roleId);
  }

  async getRolePermissions(roleId: string): Promise<string[]> {
    const role = await this.findOne(roleId);
    const permissions = new Set<string>();

    // Add direct permissions
    if (role.permissions) {
      for (const rp of role.permissions) {
        permissions.add(rp.permission.name);
      }
    }

    // Add inherited permissions from parent roles
    if (role.parentId) {
      const parentPermissions = await this.getRolePermissions(role.parentId);
      parentPermissions.forEach((p) => permissions.add(p));
    }

    return Array.from(permissions);
  }

  async getRoleHierarchy(roleId: string): Promise<any> {
    const role = await this.findOne(roleId);

    const buildHierarchy = async (r: any): Promise<any> => {
      const children = await this.prisma.role.findMany({
        where: { parentId: r.id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return {
        ...r,
        children: await Promise.all(children.map((c) => buildHierarchy(c))),
      };
    };

    return buildHierarchy(role);
  }
}

