import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpsertAudienceDto {
  @IsString()
  @Matches(/\S/, { message: 'externalId must not be blank' })
  @MaxLength(255)
  externalId!: string;

  @IsString()
  @Matches(/\S/, { message: 'name must not be blank' })
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}