import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PRIORITY_RANK } from '../src/domain/constants.js';

const prisma = new PrismaClient();

function hoursAgo(h: number, from = new Date()): Date {
  return new Date(from.getTime() - h * 60 * 60 * 1000);
}

function minutesAgo(m: number, from = new Date()): Date {
  return new Date(from.getTime() - m * 60 * 1000);
}

async function main() {
  await prisma.message.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordAgent = await bcrypt.hash('agent123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@demo.local',
      passwordHash: passwordAdmin,
      role: 'ADMIN',
    },
  });
  const riya = await prisma.user.create({
    data: {
      name: 'Riya Kapoor',
      email: 'riya@demo.local',
      passwordHash: passwordAgent,
      role: 'AGENT',
    },
  });
  const arjun = await prisma.user.create({
    data: {
      name: 'Arjun Mehta',
      email: 'arjun@demo.local',
      passwordHash: passwordAgent,
      role: 'AGENT',
    },
  });
  const neha = await prisma.user.create({
    data: {
      name: 'Neha Singh',
      email: 'neha@demo.local',
      passwordHash: passwordAgent,
      role: 'AGENT',
    },
  });

  await prisma.setting.create({
    data: { key: 'slaHours', value: '4' },
  });

  type SeedTicket = {
    subject: string;
    customerName: string | null;
    customerEmail: string | null;
    description: string;
    status: string;
    priority: string;
    assigneeId: number | null;
    createdById: number;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt: Date | null;
    firstResponseAt: Date | null;
    messages: Array<{
      type: 'REPLY' | 'NOTE';
      body: string;
      authorId: number;
      createdAt: Date;
    }>;
    activities: Array<{
      type: string;
      actorId: number;
      fromValue: string | null;
      toValue: string | null;
      createdAt: Date;
    }>;
  };

  const tickets: SeedTicket[] = [
    {
      subject: 'Cannot reset my password',
      customerName: 'Kabir Rao',
      customerEmail: 'kabir@example.com',
      description: 'The reset link in the email says it has expired after clicking.',
      status: 'OPEN',
      priority: 'HIGH',
      assigneeId: riya.id,
      createdById: admin.id,
      createdAt: hoursAgo(30),
      updatedAt: hoursAgo(28),
      resolvedAt: null,
      firstResponseAt: null,
      messages: [],
      activities: [
        { type: 'TICKET_CREATED', actorId: admin.id, fromValue: null, toValue: null, createdAt: hoursAgo(30) },
        { type: 'ASSIGNEE_CHANGED', actorId: admin.id, fromValue: null, toValue: 'Riya Kapoor', createdAt: hoursAgo(30) },
        { type: 'PRIORITY_CHANGED', actorId: admin.id, fromValue: 'MEDIUM', toValue: 'HIGH', createdAt: hoursAgo(29) },
      ],
    },
    {
      subject: 'Invoice PDF will not download',
      customerName: 'Meera Shah',
      customerEmail: 'meera@example.com',
      description: 'Clicking Download Invoice shows a blank page in Chrome.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assigneeId: arjun.id,
      createdById: riya.id,
      createdAt: hoursAgo(50),
      updatedAt: hoursAgo(2),
      resolvedAt: null,
      firstResponseAt: hoursAgo(46),
      messages: [
        { type: 'REPLY', body: 'Hi Meera, thanks for reporting this. Can you try an incognito window?', authorId: arjun.id, createdAt: hoursAgo(46) },
        { type: 'NOTE', body: 'Likely CDN cache miss on invoice service — checking with billing.', authorId: arjun.id, createdAt: hoursAgo(45) },
        { type: 'REPLY', body: 'We cleared the CDN edge. Please try again and let us know.', authorId: arjun.id, createdAt: hoursAgo(2) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: riya.id, fromValue: null, toValue: null, createdAt: hoursAgo(50) },
        { type: 'ASSIGNEE_CHANGED', actorId: riya.id, fromValue: null, toValue: 'Arjun Mehta', createdAt: hoursAgo(50) },
        { type: 'STATUS_CHANGED', actorId: arjun.id, fromValue: 'OPEN', toValue: 'IN_PROGRESS', createdAt: hoursAgo(47) },
        { type: 'REPLY_ADDED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(46) },
        { type: 'NOTE_ADDED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(45) },
        { type: 'REPLY_ADDED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(2) },
      ],
    },
    {
      subject: 'Two-factor code never arrives',
      customerName: null,
      customerEmail: 'priya@example.com',
      description: 'SMS OTP does not arrive on my registered number ending 4821.',
      status: 'WAITING_ON_CUSTOMER',
      priority: 'MEDIUM',
      assigneeId: neha.id,
      createdById: neha.id,
      createdAt: hoursAgo(10),
      updatedAt: hoursAgo(3),
      resolvedAt: null,
      firstResponseAt: hoursAgo(8),
      messages: [
        { type: 'REPLY', body: 'Hi Priya, can you confirm the country code on your profile?', authorId: neha.id, createdAt: hoursAgo(8) },
        { type: 'NOTE', body: 'Carrier is Airtel — known delay window around 9–11 IST.', authorId: neha.id, createdAt: hoursAgo(7) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: neha.id, fromValue: null, toValue: null, createdAt: hoursAgo(10) },
        { type: 'ASSIGNEE_CHANGED', actorId: neha.id, fromValue: null, toValue: 'Neha Singh', createdAt: hoursAgo(10) },
        { type: 'REPLY_ADDED', actorId: neha.id, fromValue: null, toValue: null, createdAt: hoursAgo(8) },
        { type: 'STATUS_CHANGED', actorId: neha.id, fromValue: 'OPEN', toValue: 'WAITING_ON_CUSTOMER', createdAt: hoursAgo(3) },
      ],
    },
    {
      subject: 'Account locked after failed logins',
      customerName: 'Dev Patel',
      customerEmail: 'dev@example.com',
      description: 'I tried the wrong password thrice and now I am locked out.',
      status: 'RESOLVED',
      priority: 'HIGH',
      assigneeId: riya.id,
      createdById: admin.id,
      createdAt: hoursAgo(72),
      updatedAt: hoursAgo(60),
      resolvedAt: hoursAgo(60),
      firstResponseAt: hoursAgo(70),
      messages: [
        { type: 'REPLY', body: 'Hi Dev, I have unlocked your account. Please reset your password.', authorId: riya.id, createdAt: hoursAgo(70) },
        { type: 'REPLY', body: 'Confirmed unlock. Closing this ticket — reply if anything else comes up.', authorId: riya.id, createdAt: hoursAgo(60) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: admin.id, fromValue: null, toValue: null, createdAt: hoursAgo(72) },
        { type: 'ASSIGNEE_CHANGED', actorId: admin.id, fromValue: null, toValue: 'Riya Kapoor', createdAt: hoursAgo(72) },
        { type: 'REPLY_ADDED', actorId: riya.id, fromValue: null, toValue: null, createdAt: hoursAgo(70) },
        { type: 'STATUS_CHANGED', actorId: riya.id, fromValue: 'OPEN', toValue: 'RESOLVED', createdAt: hoursAgo(60) },
        { type: 'REPLY_ADDED', actorId: riya.id, fromValue: null, toValue: null, createdAt: hoursAgo(60) },
      ],
    },
    {
      subject: 'Dashboard charts show zeros',
      customerName: 'Ananya Iyer',
      customerEmail: null,
      description: 'All analytics widgets show 0 after yesterday’s deploy.',
      status: 'OPEN',
      priority: 'URGENT',
      assigneeId: null,
      createdById: arjun.id,
      createdAt: hoursAgo(26),
      updatedAt: hoursAgo(26),
      resolvedAt: null,
      firstResponseAt: null,
      messages: [],
      activities: [
        { type: 'TICKET_CREATED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(26) },
        { type: 'PRIORITY_CHANGED', actorId: arjun.id, fromValue: 'MEDIUM', toValue: 'URGENT', createdAt: hoursAgo(26) },
      ],
    },
    {
      subject: 'Export CSV times out',
      customerName: 'Rohan Das',
      customerEmail: 'rohan@example.com',
      description: 'Large exports over 50k rows hang and eventually time out.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: arjun.id,
      createdById: admin.id,
      createdAt: hoursAgo(5),
      updatedAt: minutesAgo(40),
      resolvedAt: null,
      firstResponseAt: hoursAgo(4),
      messages: [
        { type: 'REPLY', body: 'We are reproducing with a 60k dataset. Will update shortly.', authorId: arjun.id, createdAt: hoursAgo(4) },
        { type: 'NOTE', body: 'Suspect missing index on export_jobs.created_at.', authorId: arjun.id, createdAt: minutesAgo(50) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: admin.id, fromValue: null, toValue: null, createdAt: hoursAgo(5) },
        { type: 'ASSIGNEE_CHANGED', actorId: admin.id, fromValue: null, toValue: 'Arjun Mehta', createdAt: hoursAgo(5) },
        { type: 'STATUS_CHANGED', actorId: arjun.id, fromValue: 'OPEN', toValue: 'IN_PROGRESS', createdAt: hoursAgo(4.5) },
        { type: 'REPLY_ADDED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(4) },
        { type: 'NOTE_ADDED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: minutesAgo(50) },
      ],
    },
    {
      subject: 'Wrong timezone on reports',
      customerName: 'Sana Qureshi',
      customerEmail: 'sana@example.com',
      description: 'Daily reports are stamped in UTC instead of Asia/Kolkata.',
      status: 'OPEN',
      priority: 'LOW',
      assigneeId: neha.id,
      createdById: neha.id,
      createdAt: minutesAgo(20),
      updatedAt: minutesAgo(20),
      resolvedAt: null,
      firstResponseAt: null,
      messages: [],
      activities: [
        { type: 'TICKET_CREATED', actorId: neha.id, fromValue: null, toValue: null, createdAt: minutesAgo(20) },
        { type: 'ASSIGNEE_CHANGED', actorId: neha.id, fromValue: null, toValue: 'Neha Singh', createdAt: minutesAgo(20) },
      ],
    },
    {
      subject: 'SSO login redirects to blank page',
      customerName: 'Vikram Nair',
      customerEmail: 'vikram@example.com',
      description: 'After Okta assertion we land on /callback with a blank white page.',
      status: 'OPEN',
      priority: 'URGENT',
      assigneeId: null,
      createdById: admin.id,
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(8),
      resolvedAt: null,
      firstResponseAt: null,
      messages: [],
      activities: [
        { type: 'TICKET_CREATED', actorId: admin.id, fromValue: null, toValue: null, createdAt: hoursAgo(8) },
      ],
    },
    {
      subject: 'Mobile app crashes on open',
      customerName: 'Ishita Bose',
      customerEmail: 'ishita@example.com',
      description: 'iOS 18 build 3.2.1 crashes immediately after splash.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      assigneeId: riya.id,
      createdById: riya.id,
      createdAt: hoursAgo(40),
      updatedAt: hoursAgo(12),
      resolvedAt: null,
      firstResponseAt: hoursAgo(38),
      messages: [
        { type: 'REPLY', body: 'Can you share the crash log from Settings → Privacy → Analytics?', authorId: riya.id, createdAt: hoursAgo(38) },
        { type: 'NOTE', body: 'Looks like nil unwrap in NotificationCenter listener.', authorId: riya.id, createdAt: hoursAgo(36) },
        { type: 'REPLY', body: 'Hotfix is in TestFlight — please update and confirm.', authorId: riya.id, createdAt: hoursAgo(12) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: riya.id, fromValue: null, toValue: null, createdAt: hoursAgo(40) },
        { type: 'ASSIGNEE_CHANGED', actorId: riya.id, fromValue: null, toValue: 'Riya Kapoor', createdAt: hoursAgo(40) },
        { type: 'STATUS_CHANGED', actorId: riya.id, fromValue: 'OPEN', toValue: 'IN_PROGRESS', createdAt: hoursAgo(39) },
        { type: 'REPLY_ADDED', actorId: riya.id, fromValue: null, toValue: null, createdAt: hoursAgo(38) },
        { type: 'NOTE_ADDED', actorId: riya.id, fromValue: null, toValue: null, createdAt: hoursAgo(36) },
        { type: 'REPLY_ADDED', actorId: riya.id, fromValue: null, toValue: null, createdAt: hoursAgo(12) },
      ],
    },
    {
      subject: 'Billing address cannot be updated',
      customerName: 'Farhan Ali',
      customerEmail: 'farhan@example.com',
      description: 'Save button stays disabled when editing street line 2.',
      status: 'WAITING_ON_CUSTOMER',
      priority: 'MEDIUM',
      assigneeId: arjun.id,
      createdById: arjun.id,
      createdAt: hoursAgo(18),
      updatedAt: hoursAgo(6),
      resolvedAt: null,
      firstResponseAt: hoursAgo(16),
      messages: [
        { type: 'REPLY', body: 'Could you share a screenshot of the form with validation errors?', authorId: arjun.id, createdAt: hoursAgo(16) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(18) },
        { type: 'ASSIGNEE_CHANGED', actorId: arjun.id, fromValue: null, toValue: 'Arjun Mehta', createdAt: hoursAgo(18) },
        { type: 'REPLY_ADDED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(16) },
        { type: 'STATUS_CHANGED', actorId: arjun.id, fromValue: 'OPEN', toValue: 'WAITING_ON_CUSTOMER', createdAt: hoursAgo(6) },
      ],
    },
    {
      subject: 'Webhook deliveries stuck in pending',
      customerName: null,
      customerEmail: 'ops@example.com',
      description: 'Outbound webhooks queue but never leave pending for partner ACME.',
      status: 'OPEN',
      priority: 'HIGH',
      assigneeId: null,
      createdById: admin.id,
      createdAt: hoursAgo(55),
      updatedAt: hoursAgo(55),
      resolvedAt: null,
      firstResponseAt: null,
      messages: [],
      activities: [
        { type: 'TICKET_CREATED', actorId: admin.id, fromValue: null, toValue: null, createdAt: hoursAgo(55) },
      ],
    },
    {
      subject: 'API rate limit headers missing',
      customerName: 'Leena George',
      customerEmail: 'leena@example.com',
      description: 'X-RateLimit-* headers are absent on /v1/search responses.',
      status: 'RESOLVED',
      priority: 'LOW',
      assigneeId: neha.id,
      createdById: neha.id,
      createdAt: hoursAgo(96),
      updatedAt: hoursAgo(80),
      resolvedAt: hoursAgo(80),
      firstResponseAt: hoursAgo(90),
      messages: [
        { type: 'REPLY', body: 'Headers were dropped by the edge proxy. Fix shipped in 1.8.4.', authorId: neha.id, createdAt: hoursAgo(90) },
        { type: 'NOTE', body: 'Regression test added for rate-limit header middleware.', authorId: neha.id, createdAt: hoursAgo(85) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: neha.id, fromValue: null, toValue: null, createdAt: hoursAgo(96) },
        { type: 'ASSIGNEE_CHANGED', actorId: neha.id, fromValue: null, toValue: 'Neha Singh', createdAt: hoursAgo(96) },
        { type: 'REPLY_ADDED', actorId: neha.id, fromValue: null, toValue: null, createdAt: hoursAgo(90) },
        { type: 'NOTE_ADDED', actorId: neha.id, fromValue: null, toValue: null, createdAt: hoursAgo(85) },
        { type: 'STATUS_CHANGED', actorId: neha.id, fromValue: 'IN_PROGRESS', toValue: 'RESOLVED', createdAt: hoursAgo(80) },
      ],
    },
    {
      subject: 'Dark mode contrast on badges',
      customerName: 'Tara Menon',
      customerEmail: 'tara@example.com',
      description: 'Priority badges fail WCAG AA contrast in dark theme.',
      status: 'OPEN',
      priority: 'LOW',
      assigneeId: riya.id,
      createdById: riya.id,
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(1),
      resolvedAt: null,
      firstResponseAt: hoursAgo(2),
      messages: [
        { type: 'REPLY', body: 'Thanks Tara — we have logged this with the design system team.', authorId: riya.id, createdAt: hoursAgo(2) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: riya.id, fromValue: null, toValue: null, createdAt: hoursAgo(3) },
        { type: 'ASSIGNEE_CHANGED', actorId: riya.id, fromValue: null, toValue: 'Riya Kapoor', createdAt: hoursAgo(3) },
        { type: 'REPLY_ADDED', actorId: riya.id, fromValue: null, toValue: null, createdAt: hoursAgo(2) },
      ],
    },
    {
      subject: 'Sandbox emails going to spam',
      customerName: 'Karan Malhotra',
      customerEmail: 'karan@example.com',
      description: 'Transactional emails from sandbox land in spam for Gmail users.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assigneeId: neha.id,
      createdById: admin.id,
      createdAt: hoursAgo(14),
      updatedAt: hoursAgo(4),
      resolvedAt: null,
      firstResponseAt: hoursAgo(12),
      messages: [
        { type: 'REPLY', body: 'We are aligning SPF/DKIM for the sandbox sending domain.', authorId: neha.id, createdAt: hoursAgo(12) },
        { type: 'NOTE', body: 'Need infra to rotate DKIM keys — pinging platform.', authorId: neha.id, createdAt: hoursAgo(10) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: admin.id, fromValue: null, toValue: null, createdAt: hoursAgo(14) },
        { type: 'ASSIGNEE_CHANGED', actorId: admin.id, fromValue: null, toValue: 'Neha Singh', createdAt: hoursAgo(14) },
        { type: 'STATUS_CHANGED', actorId: neha.id, fromValue: 'OPEN', toValue: 'IN_PROGRESS', createdAt: hoursAgo(13) },
        { type: 'REPLY_ADDED', actorId: neha.id, fromValue: null, toValue: null, createdAt: hoursAgo(12) },
        { type: 'NOTE_ADDED', actorId: neha.id, fromValue: null, toValue: null, createdAt: hoursAgo(10) },
      ],
    },
    {
      subject: 'Duplicate charges on renewal',
      customerName: 'Nisha Verma',
      customerEmail: 'nisha@example.com',
      description: 'Annual plan renewed twice within the same hour.',
      status: 'RESOLVED',
      priority: 'URGENT',
      assigneeId: arjun.id,
      createdById: admin.id,
      createdAt: hoursAgo(120),
      updatedAt: hoursAgo(100),
      resolvedAt: hoursAgo(100),
      firstResponseAt: hoursAgo(118),
      messages: [
        { type: 'REPLY', body: 'Hi Nisha, we refunded the duplicate charge. It should appear in 3–5 days.', authorId: arjun.id, createdAt: hoursAgo(118) },
        { type: 'NOTE', body: 'Stripe webhook replay caused double invoice — idempotency key added.', authorId: arjun.id, createdAt: hoursAgo(110) },
        { type: 'REPLY', body: 'Refund confirmed on our side. Closing the ticket.', authorId: arjun.id, createdAt: hoursAgo(100) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: admin.id, fromValue: null, toValue: null, createdAt: hoursAgo(120) },
        { type: 'ASSIGNEE_CHANGED', actorId: admin.id, fromValue: null, toValue: 'Arjun Mehta', createdAt: hoursAgo(120) },
        { type: 'REPLY_ADDED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(118) },
        { type: 'NOTE_ADDED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(110) },
        { type: 'STATUS_CHANGED', actorId: arjun.id, fromValue: 'IN_PROGRESS', toValue: 'RESOLVED', createdAt: hoursAgo(100) },
        { type: 'REPLY_ADDED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(100) },
      ],
    },
    {
      subject: 'Search ignores special characters',
      customerName: 'Ajay Krishnan',
      customerEmail: null,
      description: 'Querying for "C++" returns no results even though docs exist.',
      status: 'WAITING_ON_CUSTOMER',
      priority: 'LOW',
      assigneeId: null,
      createdById: riya.id,
      createdAt: hoursAgo(7),
      updatedAt: hoursAgo(5),
      resolvedAt: null,
      firstResponseAt: hoursAgo(6),
      messages: [
        { type: 'REPLY', body: 'Ajay, does this happen only in the docs search or also in ticket search?', authorId: riya.id, createdAt: hoursAgo(6) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: riya.id, fromValue: null, toValue: null, createdAt: hoursAgo(7) },
        { type: 'REPLY_ADDED', actorId: riya.id, fromValue: null, toValue: null, createdAt: hoursAgo(6) },
        { type: 'STATUS_CHANGED', actorId: riya.id, fromValue: 'OPEN', toValue: 'WAITING_ON_CUSTOMER', createdAt: hoursAgo(5) },
      ],
    },
    {
      subject: 'Notification preferences reset nightly',
      customerName: 'Pooja Reddy',
      customerEmail: 'pooja@example.com',
      description: 'Email digest preference flips back to daily every night at 00:00 UTC.',
      status: 'OPEN',
      priority: 'MEDIUM',
      assigneeId: arjun.id,
      createdById: arjun.id,
      createdAt: hoursAgo(28),
      updatedAt: hoursAgo(27),
      resolvedAt: null,
      firstResponseAt: null,
      messages: [
        { type: 'NOTE', body: 'Cron job syncPreferences may be overwriting user prefs.', authorId: arjun.id, createdAt: hoursAgo(27) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(28) },
        { type: 'ASSIGNEE_CHANGED', actorId: arjun.id, fromValue: null, toValue: 'Arjun Mehta', createdAt: hoursAgo(28) },
        { type: 'NOTE_ADDED', actorId: arjun.id, fromValue: null, toValue: null, createdAt: hoursAgo(27) },
      ],
    },
    {
      subject: 'CSV import rejects UTF-8 BOM',
      customerName: 'Harsh Gupta',
      customerEmail: 'harsh@example.com',
      description: 'Files saved from Excel with BOM fail validation on row 1.',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      assigneeId: neha.id,
      createdById: admin.id,
      createdAt: hoursAgo(48),
      updatedAt: hoursAgo(36),
      resolvedAt: hoursAgo(36),
      firstResponseAt: hoursAgo(46),
      messages: [
        { type: 'REPLY', body: 'We now strip BOM on upload. Please retry with the same file.', authorId: neha.id, createdAt: hoursAgo(46) },
        { type: 'REPLY', body: 'Glad it worked — resolving this ticket.', authorId: neha.id, createdAt: hoursAgo(36) },
      ],
      activities: [
        { type: 'TICKET_CREATED', actorId: admin.id, fromValue: null, toValue: null, createdAt: hoursAgo(48) },
        { type: 'ASSIGNEE_CHANGED', actorId: admin.id, fromValue: null, toValue: 'Neha Singh', createdAt: hoursAgo(48) },
        { type: 'REPLY_ADDED', actorId: neha.id, fromValue: null, toValue: null, createdAt: hoursAgo(46) },
        { type: 'STATUS_CHANGED', actorId: neha.id, fromValue: 'OPEN', toValue: 'RESOLVED', createdAt: hoursAgo(36) },
        { type: 'REPLY_ADDED', actorId: neha.id, fromValue: null, toValue: null, createdAt: hoursAgo(36) },
      ],
    },
  ];

  for (const t of tickets) {
    const created = await prisma.ticket.create({
      data: {
        subject: t.subject,
        customerName: t.customerName,
        customerEmail: t.customerEmail,
        description: t.description,
        status: t.status,
        priority: t.priority,
        priorityRank: PRIORITY_RANK[t.priority as keyof typeof PRIORITY_RANK],
        assigneeId: t.assigneeId,
        createdById: t.createdById,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        resolvedAt: t.resolvedAt,
        firstResponseAt: t.firstResponseAt,
      },
    });

    for (const m of t.messages) {
      await prisma.message.create({
        data: {
          ticketId: created.id,
          type: m.type,
          body: m.body,
          authorId: m.authorId,
          createdAt: m.createdAt,
        },
      });
    }

    for (const a of t.activities) {
      await prisma.activity.create({
        data: {
          ticketId: created.id,
          type: a.type,
          actorId: a.actorId,
          fromValue: a.fromValue,
          toValue: a.toValue,
          createdAt: a.createdAt,
        },
      });
    }
  }

  console.log(`Seeded ${tickets.length} tickets, 4 users, slaHours=4`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
