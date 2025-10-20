import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from '../roles/roles.service';
import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { UpdateRoleDto } from '../roles/dto/update-role.dto';
import { AssignPermissionDto } from '../roles/dto/assign-permission.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  @RequirePermission('role:create')
  @ApiOperation({ summary: 'Create a new role' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @RequirePermission('role:read')
  @ApiOperation({ summary: 'Get all roles' })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermission('role:read')
  @ApiOperation({ summary: 'Get role by ID' })
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @RequirePermission('role:update')
  @ApiOperation({ summary: 'Update role' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermission('role:delete')
  @ApiOperation({ summary: 'Delete role' })
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post('assign-permission')
  @RequirePermission('role:assign-permission')
  @ApiOperation({ summary: 'Assign permission to role' })
  async assignPermission(@Body() assignPermissionDto: AssignPermissionDto) {
    return this.rolesService.assignPermission(assignPermissionDto);
  }

  @Delete(':roleId/permissions/:permissionId')
  @RequirePermission('role:assign-permission')
  @ApiOperation({ summary: 'Remove permission from role' })
  async removePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removePermission(roleId, permissionId);
  }

  @Get(':roleId/permissions')
  @RequirePermission('role:read')
  @ApiOperation({ summary: 'Get role permissions' })
  async getRolePermissions(@Param('roleId') roleId: string) {
    return this.rolesService.getRolePermissions(roleId);
  }

  @Get(':roleId/hierarchy')
  @RequirePermission('role:read')
  @ApiOperation({ summary: 'Get role hierarchy' })
  async getRoleHierarchy(@Param('roleId') roleId: string) {
    return this.rolesService.getRoleHierarchy(roleId);
  }
}

