import { IsString, IsOptional } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreatePermissionDto {
  @Field()
  @IsString()
  resource: string;

  @Field()
  @IsString()
  action: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

