import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  /*
  @Body()      →  "Nest, fill this parameter with request.body"
  dto          →  "I'll refer to it as 'dto' in my code"
  SignupDto   →  "TypeScript, it should have email, password, displayName"
  */
  @Post('signup')
  signup(@Body()  //decorator = where should get the data
   dto: // varibale = where the data holded
   SignupDto // ts type =it should have email, password, displayName
  ) {
    return this.auth.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

    @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: Omit<User, 'password'>) {
    return user;
  }

  @Get('google')
@UseGuards(AuthGuard('google'))
googleAuth() {
  // empty on purpose — the guard does the redirect
}

@Get('google/callback')
@UseGuards(AuthGuard('google'))
googleAuthCallback(@Req() req: Request) {
  return this.auth.googleLogin((req as any).user);
}

@Get('health')
health() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}

}