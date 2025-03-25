import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByFingerprint(fingerprintHash: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { fingerprintHash },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(password);

    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      isActive: true,
    });

    return this.usersRepository.save(newUser);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Only allow updating certain fields for profile
    const allowedUpdates = {
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      email: updateUserDto.email,
      password: updateUserDto.password
        ? await this.hashPassword(updateUserDto.password)
        : undefined,
    };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(
      (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key],
    );

    Object.assign(user, allowedUpdates);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async linkFingerprint(email: string, fingerprintHash: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.fingerprintHash = fingerprintHash;
    return this.usersRepository.save(user);
  }

  async ensureAdminUser(): Promise<void> {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';

    this.logger.info('Checking for admin user existence', {
      email: adminEmail,
    });
    const existingAdmin = await this.findByEmail(adminEmail);

    if (!existingAdmin) {
      this.logger.info('Creating new admin user', { email: adminEmail });
      try {
        const hashedPassword = await this.hashPassword(adminPassword);
        this.logger.debug('Password hashed successfully', {
          email: adminEmail,
          passwordHash: hashedPassword,
        });

        const newAdmin = await this.create({
          email: adminEmail,
          password: adminPassword,
          role: UserRole.ADMIN,
          firstName: 'Admin',
          lastName: 'User',
        });

        this.logger.info('Admin user created successfully', {
          userId: newAdmin.id,
          email: newAdmin.email,
          role: newAdmin.role,
        });
      } catch (error) {
        this.logger.error('Failed to create admin user', {
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }
    } else {
      this.logger.info('Admin user already exists', {
        userId: existingAdmin.id,
        email: existingAdmin.email,
      });
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}
