import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, FingerprintDto, CreateUserDto } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  /**
   * Register a new user
   * @param createUserDto User registration data
   * @returns New user information
   */
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
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  /**
   * Login with fingerprint
   * @param fingerprintDto Fingerprint data
   * @returns JWT token and user information
   */
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