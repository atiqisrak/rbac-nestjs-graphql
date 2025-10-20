import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PoliciesService } from '../policies/policies.service';
import { CreatePolicyDto } from '../policies/dto/create-policy.dto';
import { UpdatePolicyDto } from '../policies/dto/update-policy.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';

@ApiTags('Policies')
@Controller('policies')
@UseGuards(JwtAuthGuard, RbacGuard)
@ApiBearerAuth()
export class PoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @Post()
  @RequirePermission('policy:create')
  @ApiOperation({ summary: 'Create a new policy' })
  async create(@Body() createPolicyDto: CreatePolicyDto) {
    return this.policiesService.create(createPolicyDto);
  }

  @Get()
  @RequirePermission('policy:read')
  @ApiOperation({ summary: 'Get all policies' })
  async findAll() {
    return this.policiesService.findAll();
  }

  @Get(':id')
  @RequirePermission('policy:read')
  @ApiOperation({ summary: 'Get policy by ID' })
  async findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }

  @Put(':id')
  @RequirePermission('policy:update')
  @ApiOperation({ summary: 'Update policy' })
  async update(@Param('id') id: string, @Body() updatePolicyDto: UpdatePolicyDto) {
    return this.policiesService.update(id, updatePolicyDto);
  }

  @Delete(':id')
  @RequirePermission('policy:delete')
  @ApiOperation({ summary: 'Delete policy' })
  async remove(@Param('id') id: string) {
    return this.policiesService.remove(id);
  }
}

