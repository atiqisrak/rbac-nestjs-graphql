import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PoliciesService } from '../policies/policies.service';
import { Policy } from '../policies/entities/policy.entity';
import { CreatePolicyDto } from '../policies/dto/create-policy.dto';
import { UpdatePolicyDto } from '../policies/dto/update-policy.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';

@Resolver(() => Policy)
@UseGuards(JwtAuthGuard, RbacGuard)
export class PoliciesResolver {
  constructor(private policiesService: PoliciesService) {}

  @Mutation(() => Policy)
  @RequirePermission('policy:create')
  async createPolicy(@Args('input') createPolicyDto: CreatePolicyDto) {
    return this.policiesService.create(createPolicyDto);
  }

  @Query(() => [Policy])
  @RequirePermission('policy:read')
  async policies() {
    return this.policiesService.findAll();
  }

  @Query(() => Policy)
  @RequirePermission('policy:read')
  async policy(@Args('id') id: string) {
    return this.policiesService.findOne(id);
  }

  @Mutation(() => Policy)
  @RequirePermission('policy:update')
  async updatePolicy(
    @Args('id') id: string,
    @Args('input') updatePolicyDto: UpdatePolicyDto,
  ) {
    return this.policiesService.update(id, updatePolicyDto);
  }

  @Mutation(() => Policy)
  @RequirePermission('policy:delete')
  async removePolicy(@Args('id') id: string) {
    return this.policiesService.remove(id);
  }
}

