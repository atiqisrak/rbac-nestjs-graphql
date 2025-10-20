import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PermissionsService } from '../permissions/permissions.service';
import { Permission } from '../permissions/entities/permission.entity';
import { CreatePermissionDto } from '../permissions/dto/create-permission.dto';
import { UpdatePermissionDto } from '../permissions/dto/update-permission.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';

@Resolver(() => Permission)
@UseGuards(JwtAuthGuard, RbacGuard)
export class PermissionsResolver {
  constructor(private permissionsService: PermissionsService) {}

  @Mutation(() => Permission)
  @RequirePermission('permission:create')
  async createPermission(@Args('input') createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Query(() => [Permission])
  @RequirePermission('permission:read')
  async permissions() {
    return this.permissionsService.findAll();
  }

  @Query(() => Permission)
  @RequirePermission('permission:read')
  async permission(@Args('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Mutation(() => Permission)
  @RequirePermission('permission:update')
  async updatePermission(
    @Args('id') id: string,
    @Args('input') updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Mutation(() => Permission)
  @RequirePermission('permission:delete')
  async removePermission(@Args('id') id: string) {
    return this.permissionsService.remove(id);
  }

  @Query(() => Boolean)
  async checkPermission(
    @Args('userId') userId: string,
    @Args('permissionName') permissionName: string,
  ) {
    return this.permissionsService.checkPermission(userId, permissionName);
  }
}

