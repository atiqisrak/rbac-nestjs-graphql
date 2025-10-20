import { Injectable } from '@nestjs/common';
import { MessagingService } from './messaging.service';

@Injectable()
export class EventsService {
  constructor(private messagingService: MessagingService) {}

  async userCreated(userId: string, email: string, username: string) {
    await this.messagingService.publishEvent('user.created', {
      userId,
      email,
      username,
    });
  }

  async userUpdated(userId: string, changes: any) {
    await this.messagingService.publishEvent('user.updated', {
      userId,
      changes,
    });
  }

  async userDeleted(userId: string) {
    await this.messagingService.publishEvent('user.deleted', {
      userId,
    });
  }

  async roleAssigned(userId: string, roleId: string, roleName: string) {
    await this.messagingService.publishEvent('role.assigned', {
      userId,
      roleId,
      roleName,
    });
  }

  async roleRemoved(userId: string, roleId: string, roleName: string) {
    await this.messagingService.publishEvent('role.removed', {
      userId,
      roleId,
      roleName,
    });
  }

  async permissionGranted(
    userId: string,
    permissionId: string,
    permissionName: string,
  ) {
    await this.messagingService.publishEvent('permission.granted', {
      userId,
      permissionId,
      permissionName,
    });
  }

  async permissionRevoked(
    userId: string,
    permissionId: string,
    permissionName: string,
  ) {
    await this.messagingService.publishEvent('permission.revoked', {
      userId,
      permissionId,
      permissionName,
    });
  }

  async resourcePermissionGranted(
    userId: string,
    resourceType: string,
    resourceId: string,
    actions: string[],
  ) {
    await this.messagingService.publishEvent('resource.permission.granted', {
      userId,
      resourceType,
      resourceId,
      actions,
    });
  }

  async resourcePermissionRevoked(
    userId: string,
    resourceType: string,
    resourceId: string,
  ) {
    await this.messagingService.publishEvent('resource.permission.revoked', {
      userId,
      resourceType,
      resourceId,
    });
  }
}

