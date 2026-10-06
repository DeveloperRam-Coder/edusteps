/* eslint-disable */
'use strict';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ────────────────────────────────────────────────────────────────
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (n) => String(n).padStart(2, '0');
const dateStr = (y, m, d) => new Date(`${y}-${pad(m)}-${pad(d)}`);

// ─── Real Indian Data ────────────────────────────────────────────────────────
const FIRST_NAMES = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan',
  'Shaurya','Atharv','Advik','Pranav','Advait','Dhruv','Kabir','Ritvik','Aarush','Darsh',
  'Ananya','Diya','Saanvi','Myra','Anika','Aadhya','Pari','Navya','Priya','Riya',
  'Kavya','Shreya','Pooja','Neha','Divya','Meera','Tanvi','Sneha','Isha','Nisha',
  'Rohan','Rahul','Amit','Suresh','Rajesh','Vikram','Nikhil','Karan','Mohit','Gaurav',
  'Sunita','Rekha','Geeta','Suman','Lata','Usha','Manju','Sarla','Kamla','Pushpa',
];
const LAST_NAMES = [
  'Sharma','Verma','Gupta','Singh','Kumar','Patel','Joshi','Mishra','Tiwari','Yadav',
  'Agarwal','Srivastava','Pandey','Dubey','Chauhan','Rajput','Mehta','Shah','Jain','Nair',
  'Reddy','Rao','Iyer','Pillai','Menon','Krishnan','Bhat','Hegde','Naik','Gowda',
];
const CITIES = ['Delhi','Mumbai','Bangalore','Hyderabad','Chennai','Kolkata','Pune','Jaipur','Lucknow','Ahmedabad'];
const AREAS = [
  'Sector 15','MG Road','Anna Nagar','Banjara Hills','Salt Lake','Koregaon Park',
  'Malviya Nagar','Gomti Nagar','Navrangpura','Jubilee Hills','Lajpat Nagar','Indiranagar',
];
const STREETS = ['Main Road','Cross Street','Colony Road','Nagar','Vihar','Enclave','Layout','Extension'];
const COURSE_NAMES = [
  'JEE Foundation','NEET Preparation','Class 10 Board Prep','Class 12 Science','Class 12 Commerce',
  'IIT-JEE Advanced','CBSE Mathematics','CBSE Physics','CBSE Chemistry','CBSE Biology',
  'English Communication','Spoken English','Competitive Maths','Vedic Mathematics','Olympiad Training',
  'NTSE Preparation','KVPY Coaching','CA Foundation','CS Foundation','CMA Foundation',
];
const RATE_TYPES = ['per_month','per_session','per_course','per_hour'];
const PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD'];
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const ROOMS = ['Room 101','Room 102','Room 103','Lab A','Lab B','Hall 1','Hall 2','Seminar Room','Library','Computer Lab'];
const TEACHERS = [
  'Mr. Sharma','Mrs. Verma','Mr. Gupta','Ms. Singh','Mr. Kumar','Mrs. Patel',
  'Mr. Joshi','Ms. Mishra','Mr. Tiwari','Mrs. Yadav','Mr. Agarwal','Ms. Srivastava',
];
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316'];

function genMobile() {
  const prefixes = ['98','97','96','95','94','93','92','91','90','89','88','87','86','85','84','83','82','81','80','79','78','77','76','75','74','73','72','71','70'];
  return rnd(prefixes) + String(rndInt(10000000, 99999999));
}

function genEmail(first, last, idx) {
  const domains = ['gmail.com','yahoo.com','hotmail.com','outlook.com','rediffmail.com'];
  return `${first.toLowerCase()}.${last.toLowerCase()}${idx}@${rnd(domains)}`;
}

function genAddress() {
  return `${rndInt(1, 999)}, ${rnd(AREAS)}, ${rnd(STREETS)}, ${rnd(CITIES)}`;
}

async function main() {
  console.log('🌱 Starting seed...\n');

  // ── 1. Clear existing data ─────────────────────────────────────────────────
  console.log('🗑️  Clearing existing data...');
  await prisma.timetables.deleteMany();
  await prisma.fee_reminders.deleteMany();
  await prisma.attendances.deleteMany();
  await prisma.payment_details.deleteMany();
  await prisma.customer_details.deleteMany();
  await prisma.enrollments.deleteMany();
  await prisma.courses.deleteMany();
  await prisma.customers.deleteMany();
  await prisma.client_permission.deleteMany();
  await prisma.clients.deleteMany();
  await prisma.users.deleteMany();
  console.log('✅ Cleared\n');

  // ── 2. Users ───────────────────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const users = await Promise.all([
    prisma.users.create({
      data: {
        email: 'rajesh.sharma@vidyamandir.com',
        mobile: '9876543210',
        name: 'Rajesh Sharma',
        password: passwordHash,
        email_verified: true,
        account_status: 'active',
        updated_at: new Date(),
      },
    }),
    prisma.users.create({
      data: {
        email: 'sunita.verma@brightfuture.com',
        mobile: '9765432109',
        name: 'Sunita Verma',
        password: passwordHash,
        email_verified: true,
        account_status: 'active',
        updated_at: new Date(),
      },
    }),
    prisma.users.create({
      data: {
        email: 'amit.gupta@excellence.com',
        mobile: '9654321098',
        name: 'Amit Gupta',
        password: passwordHash,
        email_verified: true,
        account_status: 'active',
        updated_at: new Date(),
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  // ── 3. Clients ─────────────────────────────────────────────────────────────
  console.log('🏫 Creating clients...');
  const clients = await Promise.all([
    prisma.clients.create({
      data: {
        name: 'Vidya Mandir Coaching Centre',
        phone: '0120-4567890',
        email: 'info@vidyamandir.com',
        address: '45, Sector 15, Noida, Uttar Pradesh - 201301',
        created_id: users[0].id,
        updated_id: users[0].id,
      },
    }),
    prisma.clients.create({
      data: {
        name: 'Bright Future Academy',
        phone: '022-28765432',
        email: 'contact@brightfuture.com',
        address: '12, Andheri West, Mumbai, Maharashtra - 400058',
        created_id: users[1].id,
        updated_id: users[1].id,
      },
    }),
    prisma.clients.create({
      data: {
        name: 'Excellence Institute',
        phone: '080-23456789',
        email: 'hello@excellence.com',
        address: '78, Indiranagar, Bangalore, Karnataka - 560038',
        created_id: users[2].id,
        updated_id: users[2].id,
      },
    }),
  ]);
  console.log(`✅ Created ${clients.length} clients`);

  // ── 4. Client Permissions ──────────────────────────────────────────────────
  await Promise.all(clients.map((c, i) =>
    prisma.client_permission.create({
      data: {
        client_id: c.client_id,
        user_id: users[i].id,
        created_id: users[i].id,
      },
    })
  ));
  console.log('✅ Created client permissions');

  // ── 5. Courses (20 per client = 60 total) ─────────────────────────────────
  console.log('📚 Creating courses...');
  const allCourses = [];

  for (const client of clients) {
    const shuffled = [...COURSE_NAMES].sort(() => Math.random() - 0.5).slice(0, 20);
    for (let i = 0; i < shuffled.length; i++) {
      const rateType = rnd(RATE_TYPES);
      const rate = rateType === 'per_hour' ? rndInt(200, 800)
        : rateType === 'per_session' ? rndInt(500, 2000)
        : rateType === 'per_month' ? rndInt(2000, 8000)
        : rndInt(10000, 50000);

      const course = await prisma.courses.create({
        data: {
          client_id: client.client_id,
          course_name: shuffled[i],
          description: `Comprehensive ${shuffled[i]} course for competitive exam preparation with expert faculty and study material.`,
          rate,
          rate_type: rateType,
          priority_no: i + 1,
          created_id: String(client.client_id),
          updated_id: String(client.client_id),
        },
      });
      allCourses.push(course);
    }
  }
  console.log(`✅ Created ${allCourses.length} courses`);

  // ── 6. Customers (55 per client = 165 total) ──────────────────────────────
  console.log('👨🎓 Creating customers...');
  const allCustomers = [];
  const usedMobileKeys = new Set();

  for (const client of clients) {
    let count = 0;
    let attempts = 0;
    while (count < 55 && attempts < 600) {
      attempts++;
      const firstName = rnd(FIRST_NAMES);
      const lastName = rnd(LAST_NAMES);
      const mobile = genMobile();
      const mobileKey = `${String(client.client_id)}-${mobile}`;
      if (usedMobileKeys.has(mobileKey)) continue;
      usedMobileKeys.add(mobileKey);

      const email = genEmail(firstName, lastName, count + Number(client.client_id) * 100);

      try {
        const customer = await prisma.customers.create({
          data: {
            first_name: firstName,
            last_name: lastName,
            mobile,
            email,
            address: genAddress(),
            client_id: client.client_id,
            created_id: String(client.client_id),
            updated_id: String(client.client_id),
          },
        });
        allCustomers.push(customer);
        count++;
        if (count % 10 === 0) process.stdout.write(`  ${count}/55 for ${client.name}\r`);
      } catch {
        // skip duplicate email
      }
    }
    console.log(`  ✓ ${count} customers for ${client.name}          `);
  }
  console.log(`✅ Created ${allCustomers.length} customers total`);

  // ── 7. Customer Details (1-3 per customer) ─────────────────────────────────
  console.log('📋 Creating customer details...');
  const allDetails = [];

  for (const customer of allCustomers) {
    const clientCourses = allCourses.filter(c => String(c.client_id) === String(customer.client_id));
    const numEnrollments = rndInt(1, 3);
    const pickedCourses = [...clientCourses].sort(() => Math.random() - 0.5).slice(0, numEnrollments);

    for (const course of pickedCourses) {
      const regYear = rndInt(2023, 2024);
      const regMonth = rndInt(1, 12);
      const regDay = rndInt(1, 28);
      const isActive = Math.random() > 0.15;

      try {
        const detail = await prisma.customer_details.create({
          data: {
            first_name: customer.first_name,
            last_name: customer.last_name,
            subject: course.course_name,
            registration_date: dateStr(regYear, regMonth, regDay),
            amount: Number(course.rate),
            is_active: isActive,
            deactivate_date: isActive ? null : dateStr(2024, rndInt(6, 12), rndInt(1, 28)),
            customer_id: customer.customer_id,
            created_id: String(customer.client_id),
            updated_id: String(customer.client_id),
          },
        });
        allDetails.push({ ...detail, client_id: customer.client_id, course });
      } catch {
        // skip
      }
    }
  }
  console.log(`✅ Created ${allDetails.length} customer details`);

  // ── 8. Enrollments ─────────────────────────────────────────────────────────
  console.log('🎓 Creating enrollments...');
  const enrollmentStatuses = ['active','active','active','active','completed','pending','cancelled'];
  let enrollmentCount = 0;

  for (const detail of allDetails) {
    const customer = allCustomers.find(c => String(c.customer_id) === String(detail.customer_id));
    if (!customer) continue;
    try {
      await prisma.enrollments.create({
        data: {
          course_id: detail.course.course_id,
          customer_id: customer.customer_id,
          client_id: customer.client_id,
          status: rnd(enrollmentStatuses),
          created_id: String(customer.client_id),
          updated_id: String(customer.client_id),
        },
      });
      enrollmentCount++;
    } catch {
      // skip duplicates
    }
  }
  console.log(`✅ Created ${enrollmentCount} enrollments`);

  // ── 9. Payment Details ─────────────────────────────────────────────────────
  console.log('💰 Creating payment details...');
  let paymentCount = 0;

  for (const detail of allDetails) {
    const customer = allCustomers.find(c => String(c.customer_id) === String(detail.customer_id));
    if (!customer) continue;

    const totalAmount = Number(detail.amount);
    const numPayments = rndInt(1, 4);
    const installment = Math.floor(totalAmount / numPayments);

    for (let p = 0; p < numPayments; p++) {
      const payYear = rndInt(2023, 2025);
      const payMonth = rndInt(1, 12);
      const payDay = rndInt(1, 28);
      const discount = Math.random() > 0.8 ? rndInt(100, 500) : 0;
      const paidAmount = p === numPayments - 1
        ? totalAmount - installment * (numPayments - 1)
        : installment;

      if (paidAmount <= 0) continue;

      try {
        await prisma.payment_details.create({
          data: {
            customer_id: customer.customer_id,
            cd_id: detail.cd_id,
            client_id: customer.client_id,
            paid_amount: paidAmount,
            discount_amount: discount,
            payment_mode: rnd(PAYMENT_MODES),
            transaction_ref: Math.random() > 0.4
              ? `TXN${Date.now()}${rndInt(1000, 9999)}`
              : null,
            paid_on: dateStr(payYear, payMonth, payDay),
            created_id: String(customer.client_id),
          },
        });
        paymentCount++;
      } catch {
        // skip
      }
    }
  }
  console.log(`✅ Created ${paymentCount} payment records`);

  // ── 10. Attendance (last 60 days) ──────────────────────────────────────────
  console.log('📅 Creating attendance records...');
  let attendanceCount = 0;
  const attendanceStatuses = ['present','present','present','present','absent','late','excused'];

  for (const client of clients) {
    const clientCustomers = allCustomers
      .filter(c => String(c.client_id) === String(client.client_id))
      .slice(0, 50);

    for (const customer of clientCustomers) {
      for (let daysAgo = 60; daysAgo >= 1; daysAgo--) {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        d.setHours(0, 0, 0, 0);
        const dayOfWeek = d.getDay();
        if (dayOfWeek === 0) continue;
        if (dayOfWeek === 6 && Math.random() > 0.5) continue;

        try {
          await prisma.attendances.create({
            data: {
              customer_id: customer.customer_id,
              client_id: client.client_id,
              date: d,
              status: rnd(attendanceStatuses),
              remarks: Math.random() > 0.85
                ? rnd(['Medical leave','Family function','Transport issue','Exam preparation','Holiday'])
                : null,
              marked_by: BigInt(1),
            },
          });
          attendanceCount++;
        } catch {
          // skip duplicate (unique: customer+client+date)
        }
      }
    }
    console.log(`  ✓ Attendance done for ${client.name}`);
  }
  console.log(`✅ Created ${attendanceCount} attendance records`);

  // ── 11. Fee Reminders (55 per client) ─────────────────────────────────────
  console.log('🔔 Creating fee reminders...');
  let reminderCount = 0;
  const reminderStatuses = ['pending','pending','sent','sent','failed','cancelled'];

  for (const client of clients) {
    const clientDetails = allDetails
      .filter(d => String(d.client_id) === String(client.client_id))
      .slice(0, 55);

    for (const detail of clientDetails) {
      const customer = allCustomers.find(c => String(c.customer_id) === String(detail.customer_id));
      if (!customer) continue;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + rndInt(-10, 30));
      dueDate.setHours(0, 0, 0, 0);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - rndInt(1, 5));

      try {
        await prisma.fee_reminders.create({
          data: {
            customer_id: customer.customer_id,
            client_id: client.client_id,
            cd_id: detail.cd_id,
            due_date: dueDate,
            amount_due: Number(detail.amount),
            reminder_date: reminderDate,
            status: rnd(reminderStatuses),
            sent_at: Math.random() > 0.5 ? new Date() : null,
            delivery_status: Math.random() > 0.5 ? 'delivered' : null,
          },
        });
        reminderCount++;
      } catch {
        // skip
      }
    }
  }
  console.log(`✅ Created ${reminderCount} fee reminders`);

  // ── 12. Timetables (52+ per client) ───────────────────────────────────────
  console.log('🗓️  Creating timetables...');
  let timetableCount = 0;

  const timeSlots = [
    ['07:00','08:00'],['08:00','09:00'],['09:00','10:00'],['10:00','11:00'],
    ['11:00','12:00'],['12:00','13:00'],['14:00','15:00'],['15:00','16:00'],
    ['16:00','17:00'],['17:00','18:00'],['18:00','19:00'],['19:00','20:00'],
  ];

  for (const client of clients) {
    const clientCourses = allCourses.filter(c => String(c.client_id) === String(client.client_id));
    const workingDays = DAYS.filter(d => d !== 'sunday');

    for (const day of workingDays) {
      const slotsPerDay = day === 'saturday' ? 4 : 8;
      const daySlots = [...timeSlots].sort(() => Math.random() - 0.5).slice(0, slotsPerDay);

      for (const [start, end] of daySlots) {
        const course = rnd(clientCourses);
        try {
          await prisma.timetables.create({
            data: {
              client_id: client.client_id,
              course_id: Math.random() > 0.2 ? course.course_id : null,
              title: course.course_name,
              day_of_week: day,
              start_time: start,
              end_time: end,
              room: rnd(ROOMS),
              teacher: rnd(TEACHERS),
              color: rnd(COLORS),
              is_active: true,
              created_id: String(client.client_id),
            },
          });
          timetableCount++;
        } catch {
          // skip
        }
      }
    }
  }
  console.log(`✅ Created ${timetableCount} timetable slots`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(52));
  console.log('🎉  SEED COMPLETE');
  console.log('═'.repeat(52));
  console.log(`  Users            : ${users.length}`);
  console.log(`  Clients          : ${clients.length}`);
  console.log(`  Courses          : ${allCourses.length}`);
  console.log(`  Customers        : ${allCustomers.length}`);
  console.log(`  Customer Details : ${allDetails.length}`);
  console.log(`  Enrollments      : ${enrollmentCount}`);
  console.log(`  Payments         : ${paymentCount}`);
  console.log(`  Attendance       : ${attendanceCount}`);
  console.log(`  Fee Reminders    : ${reminderCount}`);
  console.log(`  Timetable Slots  : ${timetableCount}`);
  console.log('═'.repeat(52));
  console.log('\n🔑 Login credentials (password: Admin@123)');
  console.log('  rajesh.sharma@vidyamandir.com  → Vidya Mandir Coaching Centre');
  console.log('  sunita.verma@brightfuture.com  → Bright Future Academy');
  console.log('  amit.gupta@excellence.com      → Excellence Institute\n');
}

main()
  .catch(e => {
    console.error('\n❌ Seed failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
