import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    fingerprintHash: 'testFingerprintHash',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByFingerprint: jest.fn(),
    linkFingerprint: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object without password when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUser(email, password);

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.email).toBe(email);
    });

    it('should return null when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info when credentials are valid', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const expectedToken = 'jwt-token';

      jest.spyOn(service, 'validateUser').mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
      });
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(loginDto);

      expect(result.access_token).toBe(expectedToken);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };

      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('loginWithFingerprint', () => {
    it('should return access token and user info when fingerprint is valid', async () => {
      const fingerprintDto = { fingerprintHash: 'validFingerprintHash' };
      const expectedToken = 'jwt-token';

      mockUsersService.findByFingerprint.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.loginWithFingerprint(fingerprintDto);

      expect(result.access_token).toBe(expectedToken);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException when fingerprint is invalid', async () => {
      const fingerprintDto = { fingerprintHash: 'invalidFingerprintHash' };

      mockUsersService.findByFingerprint.mockResolvedValue(null);

      await expect(
        service.loginWithFingerprint(fingerprintDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('registerFingerprint', () => {
    it('should register fingerprint and return success message', async () => {
      const email = 'test@example.com';
      const fingerprintHash = 'newFingerprintHash';

      mockUsersService.linkFingerprint.mockResolvedValue({
        ...mockUser,
        fingerprintHash,
      });

      const result = await service.registerFingerprint(email, fingerprintHash);

      expect(result.message).toBe('Fingerprint registered successfully');
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(email);
    });
  });
});
