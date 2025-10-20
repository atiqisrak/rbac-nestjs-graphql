import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create permissions
  const permissions = [
    // User permissions
    { resource: 'user', action: 'create', description: 'Create users' },
    { resource: 'user', action: 'read', description: 'Read users' },
    { resource: 'user', action: 'update', description: 'Update users' },
    { resource: 'user', action: 'delete', description: 'Delete users' },
    { resource: 'user', action: 'assign-role', description: 'Assign roles to users' },
    
    // Role permissions
    { resource: 'role', action: 'create', description: 'Create roles' },
    { resource: 'role', action: 'read', description: 'Read roles' },
    { resource: 'role', action: 'update', description: 'Update roles' },
    { resource: 'role', action: 'delete', description: 'Delete roles' },
    { resource: 'role', action: 'assign-permission', description: 'Assign permissions to roles' },
    
    // Permission permissions
    { resource: 'permission', action: 'create', description: 'Create permissions' },
    { resource: 'permission', action: 'read', description: 'Read permissions' },
    { resource: 'permission', action: 'update', description: 'Update permissions' },
    { resource: 'permission', action: 'delete', description: 'Delete permissions' },
    
    // Policy permissions
    { resource: 'policy', action: 'create', description: 'Create policies' },
    { resource: 'policy', action: 'read', description: 'Read policies' },
    { resource: 'policy', action: 'update', description: 'Update policies' },
    { resource: 'policy', action: 'delete', description: 'Delete policies' },
    
    // Resource permissions
    { resource: 'resource', action: 'grant', description: 'Grant resource permissions' },
    { resource: 'resource', action: 'revoke', description: 'Revoke resource permissions' },
    { resource: 'resource', action: 'read', description: 'Read resource permissions' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { name: `${perm.resource}:${perm.action}` },
      update: {},
      create: {
        name: `${perm.resource}:${perm.action}`,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
    });
    createdPermissions.push(permission);
    console.log(`✅ Permission created: ${permission.name}`);
  }

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
    },
  });
  console.log(`✅ Role created: ${adminRole.name}`);

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: 'Manager with limited administrative access',
      parentId: adminRole.id,
    },
  });
  console.log(`✅ Role created: ${managerRole.name}`);

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user with basic access',
    },
  });
  console.log(`✅ Role created: ${userRole.name}`);

  // Assign all permissions to admin role
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`✅ All permissions assigned to admin role`);

  // Assign read permissions to user role
  const readPermissions = createdPermissions.filter(p => p.action === 'read');
  for (const permission of readPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`✅ Read permissions assigned to user role`);

  // Create default admin user
  const hashedPassword = await bcrypt.hash('F9ICWs33ZPnw', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'atiq.israk@webable.digital' },
    update: {},
    create: {
      email: 'atiq.israk@webable.digital',
      username: 'atiqisrak',
      password: hashedPassword,
      firstName: 'Atiq',
      lastName: 'Israk',
      isEmailVerified: true,
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}`);

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  console.log(`✅ Admin role assigned to admin user`);

  // Create sample policy
  const policy = await prisma.policy.upsert({
    where: { name: 'business-hours-only' },
    update: {},
    create: {
      name: 'business-hours-only',
      description: 'Allow access only during business hours (9 AM - 5 PM)',
      effect: 'ALLOW',
      conditions: {
        type: 'time',
        startTime: '09:00',
        endTime: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
      },
    },
  });
  console.log(`✅ Policy created: ${policy.name}`);

  console.log('🎉 Seeding completed successfully!');
  console.log('\n📝 Default credentials:');
  console.log('   Email: atiq.israk@webable.digital');
  console.log('   Password: F9ICWs33ZPnw');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

