import { IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateActivationDto {
  @IsUUID()
  audienceId!: string;

  @IsString()
  @Matches(/\S/, { message: 'message must not be blank' })
  @MaxLength(1600)
  message!: string;
}