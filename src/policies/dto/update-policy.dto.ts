import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { PolicyEffect } from '@prisma/client';

@InputType()
export class UpdatePolicyDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(PolicyEffect)
  effect?: PolicyEffect;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  conditions?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

