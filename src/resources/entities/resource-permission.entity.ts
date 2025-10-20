import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ResourcePermission {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  resourceType: string;

  @Field()
  resourceId: string;

  @Field(() => [String])
  actions: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

