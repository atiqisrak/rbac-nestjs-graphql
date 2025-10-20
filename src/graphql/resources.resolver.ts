import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ResourcesService } from '../resources/resources.service';
import { ResourcePermission } from '../resources/entities/resource-permission.entity';
import { GrantResourcePermissionDto } from '../resources/dto/grant-resource-permission.dto';
import { CheckResourceAccessDto } from '../resources/dto/check-resource-access.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';

@Resolver(() => ResourcePermission)
@UseGuards(JwtAuthGuard, RbacGuard)
export class ResourcesResolver {
  constructor(private resourcesService: ResourcesService) {}

  @Mutation(() => ResourcePermission)
  @RequirePermission('resource:grant')
  async grantResourcePermission(@Args('input') grantDto: GrantResourcePermissionDto) {
    return this.resourcesService.grantPermission(grantDto);
  }

  @Mutation(() => Boolean)
  @RequirePermission('resource:revoke')
  async revokeResourcePermission(
    @Args('userId') userId: string,
    @Args('resourceType') resourceType: string,
    @Args('resourceId') resourceId: string,
  ) {
    await this.resourcesService.revokePermission(userId, resourceType, resourceId);
    return true;
  }

  @Query(() => Boolean)
  async checkResourceAccess(@Args('input') checkDto: CheckResourceAccessDto) {
    return this.resourcesService.checkAccess(checkDto);
  }

  @Query(() => [ResourcePermission])
  @RequirePermission('resource:read')
  async userResourcePermissions(
    @Args('userId') userId: string,
    @Args('resourceType', { nullable: true }) resourceType?: string,
  ) {
    return this.resourcesService.getUserResourcePermissions(userId, resourceType);
  }

  @Query(() => [ResourcePermission])
  @RequirePermission('resource:read')
  async resourcePermissions(
    @Args('resourceType') resourceType: string,
    @Args('resourceId') resourceId: string,
  ) {
    return this.resourcesService.getResourcePermissions(resourceType, resourceId);
  }
}

