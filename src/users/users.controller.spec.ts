import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      password: 'hashedPassword',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      fingerprintHash: 'hash1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      service.findAll.mockResolvedValue(Promise.resolve(mockUsers));

      const result = await controller.findAll();
      expect(result).toEqual(mockUsers);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      service.findById.mockResolvedValue(Promise.resolve(mockUsers[0]));

      const result = await controller.findOne('1');
      expect(result).toEqual(mockUsers[0]);
      expect(service.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.USER,
      };

      const newUser = {
        id: '3',
        ...createUserDto,
        password: 'hashedPassword',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.create.mockResolvedValue(Promise.resolve(newUser));

      const result = await controller.create(createUserDto);
      expect(result).toEqual(newUser);
      expect(service.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const updatedUser = {
        ...mockUsers[0],
        ...updateUserDto,
      };

      service.update.mockResolvedValue(Promise.resolve(updatedUser));

      const result = await controller.update('1', updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith('1', updateUserDto);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      service.remove.mockResolvedValue(Promise.resolve());

      await controller.remove('1');
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile when user is updating their own profile', async () => {
      const req = {
        user: {
          userId: '1',
          role: UserRole.USER,
        },
      };

      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'Profile',
      };

      const updatedUser = {
        ...mockUsers[0],
        ...updateUserDto,
      };

      service.updateProfile.mockResolvedValue(Promise.resolve(updatedUser));

      const result = await controller.updateProfile(req, '1', updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(service.updateProfile).toHaveBeenCalledWith('1', updateUserDto);
    });

    it('should allow admins to update any profile', async () => {
      const req = {
        user: {
          userId: '1', // Admin's ID
          role: UserRole.ADMIN,
        },
      };

      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'ByAdmin',
      };

      const updatedUser = {
        ...mockUsers[1], // Updating user with ID 2
        ...updateUserDto,
      };

      service.updateProfile.mockResolvedValue(Promise.resolve(updatedUser));

      const result = await controller.updateProfile(req, '2', updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(service.updateProfile).toHaveBeenCalledWith('2', updateUserDto);
    });

    it('should throw ForbiddenException when regular user tries to update another user profile', async () => {
      const req = {
        user: {
          userId: '1', // User's ID
          role: UserRole.USER,
        },
      };

      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'Forbidden',
      };

      await expect(
        controller.updateProfile(req, '2', updateUserDto),
      ).rejects.toThrow(ForbiddenException);
      expect(service.updateProfile).not.toHaveBeenCalled();
    });

    it('should strip role from updateUserDto for non-admin users', async () => {
      const req = {
        user: {
          userId: '2',
          role: UserRole.USER,
        },
      };

      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'Profile',
        role: UserRole.ADMIN, // Trying to promote themselves
      };

      const expectedDto = {
        firstName: 'Updated',
        lastName: 'Profile',
        // Role should be removed
      };

      const updatedUser = {
        ...mockUsers[1],
        ...expectedDto,
      };

      service.updateProfile.mockResolvedValue(Promise.resolve(updatedUser));

      await controller.updateProfile(req, '2', updateUserDto);
      expect(service.updateProfile).toHaveBeenCalledWith(
        '2',
        expect.objectContaining({
          firstName: 'Updated',
          lastName: 'Profile',
        }),
      );
      expect(service.updateProfile).not.toHaveBeenCalledWith(
        '2',
        expect.objectContaining({
          role: UserRole.ADMIN,
        }),
      );
    });
  });
});
