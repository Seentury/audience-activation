import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpsertCustomerDto {
  @IsString()
  @Matches(/\S/, { message: 'externalId must not be blank' })
  @MaxLength(255)
  externalId!: string;

  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'name must not be blank' })
  @MaxLength(255)
  name?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'phone must start with + and include the country code',
  })
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string | null;
}