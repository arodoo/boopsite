import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword123',
    fingerprintHash: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
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
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');
      
      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
    });
  });

  describe('findByFingerprint', () => {
    it('should return a user when found by fingerprint', async () => {
      const userWithFingerprint = { ...mockUser, fingerprintHash: 'testHash123' };
      mockRepository.findOne.mockResolvedValue(userWithFingerprint);

      const result = await service.findByFingerprint('testHash123');
      
      expect(result).toEqual(userWithFingerprint);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { fingerprintHash: 'testHash123' },
      });
    });

    it('should return null when fingerprint is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByFingerprint('nonexistentHash');
      
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const createUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({
        ...mockUser,
        email: createUserDto.email,
      });
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        email: createUserDto.email,
      });

      jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => Promise.resolve('salt'));
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword'));

      const result = await service.create(createUserDto);

      expect(result.email).toBe(createUserDto.email);
      expect(result.isActive).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when user email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('linkFingerprint', () => {
    it('should link fingerprint to existing user', async () => {
      const fingerprintHash = 'newFingerprintHash';
      mockRepository.findOne.mockResolvedValue(mockUser);
      mockRepository.save.mockResolvedValue({
        ...mockUser,
        fingerprintHash,
      });

      const result = await service.linkFingerprint('test@example.com', fingerprintHash);

      expect(result.fingerprintHash).toBe(fingerprintHash);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.linkFingerprint('nonexistent@example.com', 'hash'))
        .rejects.toThrow(NotFoundException);
    });
  });
});