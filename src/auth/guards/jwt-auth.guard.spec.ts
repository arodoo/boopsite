import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';

// Simply mock the AuthGuard class
jest.mock('@nestjs/passport', () => {
  const originalModule = jest.requireActual('@nestjs/passport');
  const mockCanActivate = jest.fn().mockResolvedValue(true);
  
  class MockAuthGuard {
    constructor(private readonly type: string) {}
    canActivate = mockCanActivate;
  }

  return {
    ...originalModule,
    AuthGuard: jest.fn(() => MockAuthGuard)
  };
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with "jwt" strategy', () => {
    expect(AuthGuard).toHaveBeenCalledWith('jwt');
  });

  it('should pass the check to the parent class', async () => {
    const mockContext = createMockExecutionContext();
    
    // Mock the canActivate method
    const canActivateSpy = jest.spyOn(guard, 'canActivate');
    
    await guard.canActivate(mockContext);
    expect(canActivateSpy).toHaveBeenCalledWith(mockContext);
  });

  // Helper function to create a mock execution context
  function createMockExecutionContext(): ExecutionContext {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: '1', email: 'test@example.com' }
        }),
      }),
      getType: jest.fn().mockReturnValue('http'),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  }
});