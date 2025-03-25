import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

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
    AuthGuard: jest.fn(() => MockAuthGuard),
  };
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: reflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access to public routes', async () => {
    const context = createMockExecutionContext();
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(await guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('should pass non-public routes to parent AuthGuard', async () => {
    const context = createMockExecutionContext();
    reflector.getAllAndOverride.mockReturnValue(false);

    await guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  // Helper function to create a mock execution context
  function createMockExecutionContext(): ExecutionContext {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: '1', email: 'test@example.com' },
        }),
      }),
      getType: jest.fn().mockReturnValue('http'),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  }
});
