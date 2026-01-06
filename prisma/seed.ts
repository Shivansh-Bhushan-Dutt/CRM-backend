import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Clear all existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.tourFile.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.guide.deleteMany({});
  await prisma.hotel.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ All existing data cleared');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@travelcrm.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isAdmin: true,
    }
  });
  console.log('✅ Admin user created:', admin.email);

  // Create managers from your list (Image 5)
  const managerPassword = await bcrypt.hash('manager123', 10);
  const managersList = [
    { name: 'Anima Biswal', email: 'anima.biswal@travelcrm.com', code: 'AB' },
    { name: 'Madhu Chaudhary', email: 'madhu@travelcrm.com', code: 'MC' },
    { name: 'Sumesh Sudharasan', email: 'sumesh@travelcrm.com', code: 'SS' },
    { name: 'Pamlesh Rana', email: 'pamlesh@travelcrm.com', code: 'PR' },
    { name: 'Ujjwal', email: 'ujjwal@travelcrm.com', code: 'UK' },
    { name: 'Shambu Rawat', email: 'shambu@travelcrm.com', code: 'SR' },
    { name: 'Jitendra Yadav', email: 'jitendra@travelcrm.com', code: 'JY' },
    { name: 'Abhay Raj Singh', email: 'abhay@travelcrm.com', code: 'AS' },
    { name: 'Nidhi Gopal', email: 'nidhi@travelcrm.com', code: 'NG' },
    { name: 'Ketan Gupta', email: 'ketan@travelcrm.com', code: 'KG' },
    { name: 'Sunil Verma', email: 'sunil@travelcrm.com', code: 'SV' },
  ];

  console.log('👥 Creating managers...');
  for (const manager of managersList) {
    const user = await prisma.user.create({
      data: {
        email: manager.email,
        password: managerPassword,
        name: manager.name,
        role: 'MANAGER',
        isAdmin: false,
      }
    });
    console.log(`✅ Manager created: ${user.name} (${manager.code})`);
  }

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Login Credentials:');
  console.log('Admin: admin@travelcrm.com / admin123');
  console.log('\nManagers (all use password: manager123):');
  managersList.forEach(m => console.log(`  - ${m.name}: ${m.email}`));
  console.log('\n✅ Database is clean and ready for your Excel imports!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
