import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { PolicyEffect } from '@prisma/client';

@InputType()
export class CreatePolicyDto {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => String, { defaultValue: 'ALLOW' })
  @IsEnum(PolicyEffect)
  effect: PolicyEffect;

  @Field()
  @IsString()
  conditions: string; // JSON string
}

