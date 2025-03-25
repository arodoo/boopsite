import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
  };

  const mockAuthService = {
    login: jest.fn(),
    loginWithFingerprint: jest.fn(),
    validateUser: jest.fn(),
    registerFingerprint: jest.fn(),
  };

  const mockUsersService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test', // Add required fields
      lastName: 'User', // Add required fields
    };

    it('should register a new user successfully', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.register(createUserDto);

      expect(result.message).toBe('User registered successfully');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(createUserDto.email);
    });
  });

  describe('login', () => {
    const loginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user and return token', async () => {
      const expectedResponse = {
        access_token: 'jwt-token',
        user: mockUser,
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginUserDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginUserDto);
    });
  });

  describe('loginWithFingerprint', () => {
    const fingerprintDto = {
      fingerprintHash: 'testFingerprintHash',
    };

    it('should login with fingerprint and return token', async () => {
      const expectedResponse = {
        access_token: 'jwt-token',
        user: mockUser,
      };

      mockAuthService.loginWithFingerprint.mockResolvedValue(expectedResponse);

      const result = await controller.loginWithFingerprint(fingerprintDto);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.loginWithFingerprint).toHaveBeenCalledWith(
        fingerprintDto,
      );
    });
  });

  describe('registerFingerprint', () => {
    const loginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const fingerprintDto = {
      fingerprintHash: 'testFingerprintHash',
    };

    it('should register fingerprint when credentials are valid', async () => {
      const expectedResponse = {
        message: 'Fingerprint registered successfully',
        user: mockUser,
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.registerFingerprint.mockResolvedValue(expectedResponse);

      const result = await controller.registerFingerprint(
        loginUserDto,
        fingerprintDto,
      );

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginUserDto.email,
        loginUserDto.password,
      );
      expect(mockAuthService.registerFingerprint).toHaveBeenCalledWith(
        loginUserDto.email,
        fingerprintDto.fingerprintHash,
      );
    });

    it('should return error when credentials are invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      const result = await controller.registerFingerprint(
        loginUserDto,
        fingerprintDto,
      );

      expect(result).toEqual({
        success: false,
        message: 'Invalid credentials',
      });
      // Ensure registerFingerprint is not called
      expect(mockAuthService.registerFingerprint).not.toHaveBeenCalled();

      // Verify validateUser was called with correct parameters
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginUserDto.email,
        loginUserDto.password,
      );
    });
  });
});
