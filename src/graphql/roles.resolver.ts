import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RolesService } from '../roles/roles.service';
import { Role } from '../roles/entities/role.entity';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../roles/dto/update-role.dto';
import { AssignPermissionDto } from '../roles/dto/assign-permission.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';

@Resolver(() => Role)
@UseGuards(JwtAuthGuard, RbacGuard)
export class RolesResolver {
  constructor(private rolesService: RolesService) {}

  @Mutation(() => Role)
  @RequirePermission('role:create')
  async createRole(@Args('input') createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Query(() => [Role])
  @RequirePermission('role:read')
  async roles() {
    return this.rolesService.findAll();
  }

  @Query(() => Role)
  @RequirePermission('role:read')
  async role(@Args('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Mutation(() => Role)
  @RequirePermission('role:update')
  async updateRole(
    @Args('id') id: string,
    @Args('input') updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Mutation(() => Role)
  @RequirePermission('role:delete')
  async removeRole(@Args('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Mutation(() => Role)
  @RequirePermission('role:assign-permission')
  async assignPermissionToRole(@Args('input') assignPermissionDto: AssignPermissionDto) {
    return this.rolesService.assignPermission(assignPermissionDto);
  }

  @Mutation(() => Role)
  @RequirePermission('role:assign-permission')
  async removePermissionFromRole(
    @Args('roleId') roleId: string,
    @Args('permissionId') permissionId: string,
  ) {
    return this.rolesService.removePermission(roleId, permissionId);
  }

  @Query(() => [String])
  @RequirePermission('role:read')
  async rolePermissions(@Args('roleId') roleId: string) {
    return this.rolesService.getRolePermissions(roleId);
  }
}

