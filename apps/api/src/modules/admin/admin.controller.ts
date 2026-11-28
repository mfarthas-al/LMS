import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  adminCreateUserSchema,
  adminListUsersSchema,
  adminSetUserStatusSchema,
  type AdminCreateUserInput,
  type AdminListUsersInput,
} from '@lms/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../../common/types/request-user';
import { AdminService } from './admin.service';

/**
 * Account management (ADMIN and SUPER_ADMIN):
 *   GET   /admin/users                      list accounts this admin can manage
 *   POST  /admin/users                      create an account → returns a one-time temporary password
 *   PATCH /admin/users/:id/status           { isActive } enable / disable (disabling signs out every device)
 *   POST  /admin/users/:id/reset-password   issue a new temporary password
 */
@Controller('admin')
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('users')
  listUsers(
    @CurrentUser() actor: RequestUser,
    @Query(new ZodValidationPipe(adminListUsersSchema)) query: AdminListUsersInput,
  ) {
    return this.admin.listUsers(actor, query);
  }

  @Post('users')
  createUser(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(adminCreateUserSchema)) body: AdminCreateUserInput,
    @Req() req: Request,
  ) {
    return this.admin.createUser(actor, body, req.ip);
  }

  @Patch('users/:id/status')
  setStatus(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminSetUserStatusSchema)) body: { isActive: boolean },
    @Req() req: Request,
  ) {
    return this.admin.setStatus(actor, id, body.isActive, req.ip);
  }

  @Post('users/:id/reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@CurrentUser() actor: RequestUser, @Param('id') id: string, @Req() req: Request) {
    return this.admin.resetPassword(actor, id, req.ip);
  }
}
