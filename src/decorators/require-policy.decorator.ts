import { SetMetadata } from '@nestjs/common';

export const POLICY_KEY = 'policies';
export const RequirePolicy = (...policies: string[]) =>
  SetMetadata(POLICY_KEY, policies);

