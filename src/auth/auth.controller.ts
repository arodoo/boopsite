import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginUserDto,
  FingerprintDto,
  CreateUserDto,
} from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Register a new user
   * @param createUserDto User registration data
   * @returns New user information
   */
  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Login with email and password
   * @param loginUserDto User login data
   * @returns JWT token and user information
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    this.logger.info('Login request received', {
      email: loginUserDto.email,
      timestamp: new Date().toISOString(),
    });
    try {
      const result = await this.authService.login(loginUserDto);
      this.logger.info('Login successful', {
        email: loginUserDto.email,
        timestamp: new Date().toISOString(),
      });
      return result;
    } catch (error) {
      this.logger.error('Login failed', {
        email: loginUserDto.email,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Login with fingerprint
   * @param fingerprintDto Fingerprint data
   * @returns JWT token and user information
   */
  @Public()
  @Post('login/fingerprint')
  @HttpCode(HttpStatus.OK)
  async loginWithFingerprint(@Body() fingerprintDto: FingerprintDto) {
    return this.authService.loginWithFingerprint(fingerprintDto);
  }

  /**
   * Register a fingerprint for an existing user
   * @param loginUserDto User login data
   * @param fingerprintDto Fingerprint data
   * @returns Success message and user information
   */
  @Public()
  @Post('fingerprint/register')
  async registerFingerprint(
    @Body('user') loginUserDto: LoginUserDto,
    @Body('fingerprint') fingerprintDto: FingerprintDto,
  ) {
    // First validate the user with email/password
    const validatedUser = await this.authService.validateUser(
      loginUserDto.email,
      loginUserDto.password,
    );

    if (!validatedUser) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Then register the fingerprint
    return this.authService.registerFingerprint(
      loginUserDto.email,
      fingerprintDto.fingerprintHash,
    );
  }
}
