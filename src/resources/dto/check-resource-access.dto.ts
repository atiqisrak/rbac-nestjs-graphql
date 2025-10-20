import { IsString, IsUUID } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CheckResourceAccessDto {
  @Field()
  @IsUUID()
  userId: string;

  @Field()
  @IsString()
  resourceType: string;

  @Field()
  @IsString()
  resourceId: string;

  @Field()
  @IsString()
  action: string;
}

