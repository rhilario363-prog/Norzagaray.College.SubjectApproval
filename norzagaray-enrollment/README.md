
Students and professors use one login form; the server detects the account role and routes to the correct dashboard. New accounts must be verified and approved by the administrator before login is allowed.
This is a [Next.js](https://nextjs.org) project for Norzagaray College enrollment and irregular-student advising.

## Demo access

- Student: `student` / `student`
- Adviser: `adviser` / `adviser`
- Admin: `admin` / `ChangeMe123!`

The administrator workspace is available at `/admin/dashboard` for approving legitimate student and professor accounts. The professor workspace is available at `/adviser/dashboard`; professors can add, archive, and restore subjects, approve irregular-student loads, and scan subject photos with Gemini AI to prefill the catalog. UniFAST coverage is represented as a four-year limit.

## Data and scale

The current browser demo uses local storage so it can run without provisioning a database. That means it is not yet a multi-user production system: separate browsers do not share changes, and local storage is not appropriate for a simultaneous enrollment rush. Before deployment, run the Prisma schema against the configured PostgreSQL database, replace the browser-store calls with authenticated API routes, and add database transactions plus connection pooling. The schema already includes adviser roles, archived courses, graduation status, and separate adviser approval state for that migration.

## Online deployment setup

Set `DATABASE_URL`, `DIRECT_URL`, `GEMINI_API_KEY`, and a long random `SESSION_SECRET` in the hosting provider's server environment. From the project root, run `npm run db:generate`, `npm run db:push`, and `npm run db:seed` once. Seeded accounts use `admin`, `adviser.beed`, `adviser.bsed`, `adviser.bshm`, and `adviser.general` with the temporary password `ChangeMe123!`; change those passwords immediately after first login.

For Gmail verification and password recovery, configure `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_FROM`, and `NEXT_PUBLIC_APP_URL`. Use a Gmail App Password, not the normal Gmail password. Public registration supports students and professor requests. Professor requests are always pending until an administrator approves them; a student cannot promote their own account by changing a form field.

If upgrading a database that still contains registrar users, run `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN'; UPDATE "User" SET role = 'ADMIN' WHERE role = 'REGISTRAR';` as a database administrator before `npm run db:push`, then run the seed command.

To put the system online, deploy this Next.js project to Vercel (or another Node-compatible host), connect the hosted app to the configured Supabase PostgreSQL database, and set every variable from `.env.local` in the host's server environment. Set `NEXT_PUBLIC_APP_URL` to the exact public HTTPS URL, such as `https://enrollment.example.com`, never `http://localhost:3000`. Gmail verification links cannot open a local development server from another device. After changing the public URL, create a new account or use resend verification so a fresh link is generated.

When running locally without Gmail SMTP, registration and password recovery show development-only links in the page so the workflow can be tested. Those links are never returned in production; production registration is blocked until SMTP is configured. A syntactically valid Gmail address is not proof of ownership: the expiring verification link is the proof.

If an account was created before email was configured, use `/resend-verification`. With SMTP configured it sends a new Gmail message; locally it displays a development-only link.

Student lifecycle rules: BEED, BSEd, and BSHM are four-year programs; ACT is a two-year program. A student may be `ACTIVE`, `NOT_ENROLLED`, `STOPPED`, `TRANSFEREE`, or `GRADUATED`. Not enrolled and stopped records are retained and can be resumed, while graduated records remain read-only. Transferees retain their previous school and evaluated transfer-credit count for adviser review.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
