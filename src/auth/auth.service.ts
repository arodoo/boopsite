import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginUserDto, FingerprintDto } from '../users/dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate user by email and password
   * @param email User's email
   * @param password Plain text password
   * @returns User object without password
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }

  /**
   * Login with email and password
   * @param user User data
   * @returns JWT token and user information
   */
  async login(user: LoginUserDto) {
    const validatedUser = await this.validateUser(user.email, user.password);
    
    if (!validatedUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: validatedUser.email, sub: validatedUser.id };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: validatedUser.id,
        email: validatedUser.email,
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
    
    const payload = { email: user.email, sub: user.id };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
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
      },
    };
  }
}