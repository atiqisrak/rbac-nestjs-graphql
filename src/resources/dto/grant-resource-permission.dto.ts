import { IsString, IsArray, IsUUID } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GrantResourcePermissionDto {
  @Field()
  @IsUUID()
  userId: string;

  @Field()
  @IsString()
  resourceType: string;

  @Field()
  @IsString()
  resourceId: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  actions: string[];
}

