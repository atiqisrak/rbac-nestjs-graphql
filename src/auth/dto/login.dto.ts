import { IsString } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class LoginDto {
  @Field()
  @IsString()
  usernameOrEmail: string;

  @Field()
  @IsString()
  password: string;
}

