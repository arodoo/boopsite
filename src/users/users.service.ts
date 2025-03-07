import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Find a user by email
   * @param email User's email
   * @returns User object or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Find a user by fingerprint hash
   * @param fingerprintHash User's fingerprint hash
   * @returns User object or null if not found
   */
  async findByFingerprint(fingerprintHash: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { fingerprintHash } 
    });
  }

  /**
   * Create a new user
   * @param createUserDto User creation data
   * @returns Created user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password } = createUserDto;
    
    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await this.hashPassword(password);
    
    // Create new user
    const newUser = this.usersRepository.create({
      email,
      password: hashedPassword,
      isActive: true,
    });
    
    return this.usersRepository.save(newUser);
  }

  /**
   * Link a fingerprint hash to a user
   * @param userId User ID
   * @param fingerprintHash Fingerprint hash to link
   * @returns Updated user
   */
  async linkFingerprint(email: string, fingerprintHash: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    user.fingerprintHash = fingerprintHash;
    return this.usersRepository.save(user);
  }

  /**
   * Hash a password using bcrypt
   * @param password Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}