import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { ROLES_KEY } from '../decorators/require-role.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const user = this.getUser(context);

    if (!user) {
      return false;
    }

    if (requiredRoles) {
      const userRoles = user.roles?.map((ur: any) => ur.role.name) || [];
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        return false;
      }
    }

    if (requiredPermissions) {
      const userPermissions = this.extractUserPermissions(user);
      const hasPermission = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );
      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }

  private getUser(context: ExecutionContext) {
    const contextType = context.getType();

    if (contextType === 'http') {
      return context.switchToHttp().getRequest().user;
    }

    if (contextType === 'graphql' || contextType.toString() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req.user;
    }

    if (contextType === 'rpc') {
      return context.switchToRpc().getData().user;
    }

    return null;
  }

  private extractUserPermissions(user: any): string[] {
    const permissions: string[] = [];

    if (user.roles) {
      for (const userRole of user.roles) {
        if (userRole.role && userRole.role.permissions) {
          for (const rolePermission of userRole.role.permissions) {
            if (rolePermission.permission) {
              permissions.push(rolePermission.permission.name);
            }
          }
        }
      }
    }

    return permissions;
  }
}

