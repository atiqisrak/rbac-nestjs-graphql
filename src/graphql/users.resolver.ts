import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { AssignRoleDto } from '../users/dto/assign-role.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

@Resolver(() => User)
@UseGuards(JwtAuthGuard, RbacGuard)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => [User])
  @RequirePermission('user:read')
  async users() {
    return this.usersService.findAll();
  }

  @Query(() => User)
  @RequirePermission('user:read')
  async user(@Args('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Query(() => User)
  async myProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.id);
  }

  @Mutation(() => User)
  @RequirePermission('user:update')
  async updateUser(
    @Args('id') id: string,
    @Args('input') updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Mutation(() => User)
  @RequirePermission('user:delete')
  async removeUser(@Args('id') id: string) {
    return this.usersService.remove(id);
  }

  @Mutation(() => User)
  @RequirePermission('user:assign-role')
  async assignRole(@Args('input') assignRoleDto: AssignRoleDto) {
    return this.usersService.assignRole(assignRoleDto);
  }

  @Mutation(() => User)
  @RequirePermission('user:assign-role')
  async removeUserRole(
    @Args('userId') userId: string,
    @Args('roleId') roleId: string,
  ) {
    return this.usersService.removeRole(userId, roleId);
  }

  @Query(() => [String])
  @RequirePermission('user:read')
  async userPermissions(@Args('userId') userId: string) {
    return this.usersService.getUserPermissions(userId);
  }

  @Query(() => [String])
  @RequirePermission('user:read')
  async userRoles(@Args('userId') userId: string) {
    return this.usersService.getUserRoles(userId);
  }
}

