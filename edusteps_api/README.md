# NestJS + Prisma + PostgreSQL Clean Architecture Starter

This is a starter scaffold generated for you. It includes User, Auth, Client, Customer, Course, Subcustomer, and Enrollment modules and uses Prisma for Postgres.

Quick start:
1. Copy `.env.example` to `.env` and adjust DATABASE_URL
2. npm install
3. npx prisma generate
4. npx prisma migrate dev --name init
5. npm run start:dev

Pull the DB
npx prisma db pull

API endpoints:
- POST /auth/login
- POST /auth/register
- GET /auth/me
- POST /users
- GET /users/me
- PUT /users/me
- GET /clients
- POST /clients
- GET /customers
- POST /customers
- GET /courses
- POST /courses
- GET /enrollments
- POST /enrollments
