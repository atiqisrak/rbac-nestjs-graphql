import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const contextType = context.getType();
    
    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest();
      return request.user;
    }
    
    if (contextType === 'graphql' || contextType.toString() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req.user;
    }
    
    if (contextType === 'rpc') {
      const rpcContext = context.switchToRpc().getData();
      return rpcContext.user;
    }
    
    return null;
  },
);

