export class CreateUserDto {
  email: string;
  password: string;
}

export class LoginUserDto {
  email: string;
  password: string;
}

export class FingerprintDto {
  fingerprintHash: string;
}