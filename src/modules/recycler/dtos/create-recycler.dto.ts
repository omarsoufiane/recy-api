import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRecyclerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;
}
