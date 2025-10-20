import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { POLICY_KEY } from '../decorators/require-policy.decorator';
import { PoliciesService } from '../policies/policies.service';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private policiesService: PoliciesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPolicies = this.reflector.getAllAndOverride<string[]>(
      POLICY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPolicies) {
      return true;
    }

    const user = this.getUser(context);
    const request = this.getRequest(context);

    if (!user) {
      return false;
    }

    for (const policyName of requiredPolicies) {
      const canAccess = await this.policiesService.evaluatePolicy(
        policyName,
        user,
        request,
      );
      if (!canAccess) {
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

  private getRequest(context: ExecutionContext) {
    const contextType = context.getType();

    if (contextType === 'http') {
      return context.switchToHttp().getRequest();
    }

    if (contextType === 'graphql' || contextType.toString() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req;
    }

    if (contextType === 'rpc') {
      return context.switchToRpc().getData();
    }

    return null;
  }
}

