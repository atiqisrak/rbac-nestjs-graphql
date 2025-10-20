import { IsUUID } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AssignPermissionDto {
  @Field()
  @IsUUID()
  roleId: string;

  @Field()
  @IsUUID()
  permissionId: string;
}

