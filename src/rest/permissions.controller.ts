import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from '../permissions/permissions.service';
import { CreatePermissionDto } from '../permissions/dto/create-permission.dto';
import { UpdatePermissionDto } from '../permissions/dto/update-permission.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';

@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Post()
  @RequirePermission('permission:create')
  @ApiOperation({ summary: 'Create a new permission' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @RequirePermission('permission:read')
  @ApiOperation({ summary: 'Get all permissions' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get('grouped')
  @RequirePermission('permission:read')
  @ApiOperation({ summary: 'Get permissions grouped by resource' })
  async groupedByResource() {
    return this.permissionsService.groupByResource();
  }

  @Get(':id')
  @RequirePermission('permission:read')
  @ApiOperation({ summary: 'Get permission by ID' })
  async findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Put(':id')
  @RequirePermission('permission:update')
  @ApiOperation({ summary: 'Update permission' })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @RequirePermission('permission:delete')
  @ApiOperation({ summary: 'Delete permission' })
  async remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }

  @Get('check/:userId')
  @ApiOperation({ summary: 'Check if user has permission' })
  async checkPermission(
    @Param('userId') userId: string,
    @Query('permissionName') permissionName: string,
  ) {
    return this.permissionsService.checkPermission(userId, permissionName);
  }
}

