import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ResourcesService } from '../resources/resources.service';

interface AuthRequest {
  usernameOrEmail: string;
  password: string;
}

interface CheckPermissionRequest {
  userId: string;
  permissionName: string;
}

interface CheckRoleRequest {
  userId: string;
  roleName: string;
}

interface GetUserRolesRequest {
  userId: string;
}

interface GetUserPermissionsRequest {
  userId: string;
}

interface CheckResourceAccessRequest {
  userId: string;
  resourceType: string;
  resourceId: string;
  action: string;
}

@Controller()
export class RbacGrpcController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private permissionsService: PermissionsService,
    private resourcesService: ResourcesService,
  ) {}

  @GrpcMethod('RbacService', 'Authenticate')
  async authenticate(data: AuthRequest) {
    const result = await this.authService.login({
      usernameOrEmail: data.usernameOrEmail,
      password: data.password,
    });

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: result.userId,
      email: result.email,
      username: result.username,
    };
  }

  @GrpcMethod('RbacService', 'CheckPermission')
  async checkPermission(data: CheckPermissionRequest) {
    const hasPermission = await this.permissionsService.checkPermission(
      data.userId,
      data.permissionName,
    );

    return { hasPermission };
  }

  @GrpcMethod('RbacService', 'CheckRole')
  async checkRole(data: CheckRoleRequest) {
    const roles = await this.usersService.getUserRoles(data.userId);
    const hasRole = roles.includes(data.roleName);

    return { hasRole };
  }

  @GrpcMethod('RbacService', 'GetUserRoles')
  async getUserRoles(data: GetUserRolesRequest) {
    const roles = await this.usersService.getUserRoles(data.userId);

    return { roles };
  }

  @GrpcMethod('RbacService', 'GetUserPermissions')
  async getUserPermissions(data: GetUserPermissionsRequest) {
    const permissions = await this.usersService.getUserPermissions(data.userId);

    return { permissions };
  }

  @GrpcMethod('RbacService', 'CheckResourceAccess')
  async checkResourceAccess(data: CheckResourceAccessRequest) {
    const hasAccess = await this.resourcesService.checkAccess({
      userId: data.userId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      action: data.action,
    });

    return { hasAccess };
  }
}

