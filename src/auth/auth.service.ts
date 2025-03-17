import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginUserDto, FingerprintDto } from '../users/dto/user.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {}

  /**
   * Validate user by email and password
   * @param email User's email
   * @param password Plain text password
   * @returns User object without password
   */
  async validateUser(email: string, password: string): Promise<any> {
    this.logger.info('Attempting to validate user', { email });
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.error('User not found during validation', { email });
      return null;
    }

    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      this.logger.info('Password validation result', { 
        email, 
        isValid: isPasswordValid,
        passwordHash: user.password 
      });

      if (isPasswordValid) {
        const { password, ...result } = user;
        return result;
      }
    } catch (error) {
      this.logger.error('Error during password validation', { 
        email, 
        error: error.message,
        stack: error.stack 
      });
    }

    return null;
  }

  /**
   * Login with email and password
   * @param user User data
   * @returns JWT token and user information
   */
  async login(user: LoginUserDto) {
    this.logger.info('Login attempt', { email: user.email });
    const validatedUser = await this.validateUser(user.email, user.password);
    
    if (!validatedUser) {
      this.logger.error('Login failed - invalid credentials', { email: user.email });
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      email: validatedUser.email, 
      sub: validatedUser.id,
      role: validatedUser.role
    };
    
    this.logger.info('Login successful', { 
      email: user.email, 
      userId: validatedUser.id,
      role: validatedUser.role 
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: validatedUser.id,
        email: validatedUser.email,
        role: validatedUser.role,
        firstName: validatedUser.firstName,
        lastName: validatedUser.lastName,
      },
    };
  }

  /**
   * Login with fingerprint
   * @param fingerprintDto Fingerprint data
   * @returns JWT token and user information
   */
  async loginWithFingerprint(fingerprintDto: FingerprintDto) {
    const user = await this.usersService.findByFingerprint(fingerprintDto.fingerprintHash);
    
    if (!user) {
      throw new UnauthorizedException('Invalid fingerprint');
    }
    
    const payload = { 
      email: user.email, 
      sub: user.id,
      role: user.role
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Register a fingerprint for an existing user
   * @param email User's email
   * @param fingerprintHash Fingerprint hash to register
   * @returns Updated user information
   */
  async registerFingerprint(email: string, fingerprintHash: string) {
    const user = await this.usersService.linkFingerprint(email, fingerprintHash);
    return {
      message: 'Fingerprint registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}