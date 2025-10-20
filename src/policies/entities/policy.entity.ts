import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { PolicyEffect } from '@prisma/client';

registerEnumType(PolicyEffect, {
  name: 'PolicyEffect',
});

@ObjectType()
export class Policy {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => PolicyEffect)
  effect: PolicyEffect;

  @Field()
  conditions: string; // JSON string

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

