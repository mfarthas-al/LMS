import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  // GoogleStrategy is added here once GOOGLE_CLIENT_ID / SECRET are configured.
  providers: [AuthService, PasswordService, SessionService, JwtStrategy],
  exports: [AuthService, PasswordService, SessionService],
})
export class AuthModule {}
