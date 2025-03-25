import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeepPartial, SaveOptions } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

// Mock bcrypt to avoid actual hashing during tests
jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;

  // Sample user data for tests
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      password: 'hashedPassword',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      fingerprintHash: 'admin-hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      email: 'user@example.com',
      password: 'hashedPassword',
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
      isActive: true,
      fingerprintHash: 'user-hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Sample DTO for testing
  const sampleCreateUserDto: CreateUserDto = {
    email: 'new@example.com',
    password: 'password123',
    firstName: 'New',
    lastName: 'User',
    role: UserRole.USER,
  };

  const sampleUpdateUserDto: UpdateUserDto = {
    firstName: 'Updated',
    lastName: 'Name',
  };

  beforeEach(async () => {
    // Create mock repository
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    // Set up test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));

    // Setup default mock implementations
    userRepository.find.mockResolvedValue(mockUsers);
    userRepository.create.mockImplementation((dto) => {
      const user = new User();
      Object.assign(user, dto);
      return user;
    });

    // Correctly type the save method to match Repository.save
    userRepository.save.mockImplementation(
      (
        entity: DeepPartial<User> | DeepPartial<User>[],
        options?: SaveOptions,
      ): Promise<any> => {
        if (Array.isArray(entity)) {
          return Promise.resolve(
            entity.map(
              (e) =>
                ({
                  id: '1',
                  email: 'test@example.com',
                  password: 'hashedPassword',
                  firstName: 'Test',
                  lastName: 'User',
                  role: UserRole.USER,
                  isActive: true,
                  fingerprintHash: 'hash',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  ...e,
                }) as User,
            ),
          );
        }

        return Promise.resolve({
          id: '1',
          email: 'test@example.com',
          password: 'hashedPassword',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.USER,
          isActive: true,
          fingerprintHash: 'hash',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...entity,
        } as User);
      },
    );

    userRepository.remove.mockImplementation((entity: User): Promise<User> => {
      return Promise.resolve(entity);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await service.findAll();
      expect(result).toEqual(mockUsers);
      expect(userRepository.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find and return a user by ID', async () => {
      userRepository.findOne.mockResolvedValue(mockUsers[0]);

      const result = await service.findById('1');
      expect(result).toEqual(mockUsers[0]);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should find and return a user by email', async () => {
      userRepository.findOne.mockResolvedValue(mockUsers[0]);

      const result = await service.findByEmail('admin@example.com');
      expect(result).toEqual(mockUsers[0]);
    });

    it('should return null when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.create(sampleCreateUserDto);

      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(
        sampleCreateUserDto.password,
        'salt',
      );
      expect(userRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('email', sampleCreateUserDto.email);
    });

    it('should throw ConflictException when email already exists', async () => {
      const conflictDto: CreateUserDto = {
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      userRepository.findOne.mockResolvedValue(mockUsers[0]);

      await expect(service.create(conflictDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update user details', async () => {
      userRepository.findOne.mockResolvedValue(mockUsers[0]);

      const result = await service.update('1', sampleUpdateUserDto);

      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('firstName', sampleUpdateUserDto.firstName);
    });

    it('should hash password when updating password', async () => {
      userRepository.findOne.mockResolvedValue(mockUsers[0]);

      await service.update('1', { password: 'newpassword' });

      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 'salt');
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', sampleUpdateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields only', async () => {
      userRepository.findOne.mockResolvedValue(mockUsers[0]);

      const result = await service.updateProfile('1', {
        firstName: 'Updated',
        lastName: 'Profile',
      });

      expect(result).toHaveProperty('firstName', 'Updated');
    });

    it('should not update role or other restricted fields', async () => {
      const user = { ...mockUsers[0], role: UserRole.USER };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.updateProfile('1', {
        firstName: 'Updated',
        role: UserRole.ADMIN,
      });

      expect(result.role).toBe(UserRole.USER); // Role should remain unchanged
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      userRepository.findOne.mockResolvedValue(mockUsers[0]);

      await service.remove('1');

      expect(userRepository.remove).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('linkFingerprint', () => {
    it('should link fingerprint hash to a user', async () => {
      const user = { ...mockUsers[0], fingerprintHash: undefined };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.linkFingerprint(
        'admin@example.com',
        'test-fingerprint-hash',
      );

      expect(result).toHaveProperty('fingerprintHash', 'test-fingerprint-hash');
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.linkFingerprint('nonexistent@example.com', 'hash'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByFingerprint', () => {
    it('should find user by fingerprint hash', async () => {
      userRepository.findOne.mockResolvedValue(mockUsers[0]);

      const result = await service.findByFingerprint('admin-hash');
      expect(result).toEqual(mockUsers[0]);
    });

    it('should return null when no user has the fingerprint', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByFingerprint('nonexistent-hash');
      expect(result).toBeNull();
    });
  });
});
