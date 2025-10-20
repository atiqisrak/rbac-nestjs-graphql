import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ResourcesService } from '../resources/resources.service';
import { GrantResourcePermissionDto } from '../resources/dto/grant-resource-permission.dto';
import { CheckResourceAccessDto } from '../resources/dto/check-resource-access.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';

@ApiTags('Resource Permissions')
@Controller('resources')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class ResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  @Post('grant')
  @RequirePermission('resource:grant')
  @ApiOperation({ summary: 'Grant resource permission to user' })
  async grantPermission(@Body() grantDto: GrantResourcePermissionDto) {
    return this.resourcesService.grantPermission(grantDto);
  }

  @Delete(':userId/:resourceType/:resourceId')
  @RequirePermission('resource:revoke')
  @ApiOperation({ summary: 'Revoke resource permission from user' })
  async revokePermission(
    @Param('userId') userId: string,
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    await this.resourcesService.revokePermission(userId, resourceType, resourceId);
    return { success: true };
  }

  @Post('check-access')
  @ApiOperation({ summary: 'Check if user has access to resource' })
  async checkAccess(@Body() checkDto: CheckResourceAccessDto) {
    return this.resourcesService.checkAccess(checkDto);
  }

  @Get('user/:userId')
  @RequirePermission('resource:read')
  @ApiOperation({ summary: 'Get user resource permissions' })
  async getUserResourcePermissions(
    @Param('userId') userId: string,
    @Query('resourceType') resourceType?: string,
  ) {
    return this.resourcesService.getUserResourcePermissions(userId, resourceType);
  }

  @Get(':resourceType/:resourceId')
  @RequirePermission('resource:read')
  @ApiOperation({ summary: 'Get all permissions for a resource' })
  async getResourcePermissions(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.resourcesService.getResourcePermissions(resourceType, resourceId);
  }
}

