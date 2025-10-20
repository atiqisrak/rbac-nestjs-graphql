import { IsString, IsUUID } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AssignRoleDto {
  @Field()
  @IsUUID()
  userId: string;

  @Field()
  @IsUUID()
  roleId: string;
}

