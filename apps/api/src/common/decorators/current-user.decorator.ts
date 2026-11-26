import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Injects the authenticated user (set by the JWT strategy) into a handler. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest().user;
});
