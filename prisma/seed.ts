import { PrismaClient, TeamRole, SystemRole, Priority, WorkItemType, WorkItemStatus, TicketChannel, ActivityAction } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting deterministic seed for instOS...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Teams
  const teamsData = [
    { name: 'Customer Support', slug: 'support', description: 'Tier-1 and Tier-2 customer inquiry triage' },
    { name: 'Payments Operations', slug: 'payments', description: 'High-risk payment reconciliation & disputes' },
    { name: 'Infrastructure & Reliability', slug: 'infra', description: 'Core cloud platform & incident response' },
    { name: 'Trust & Compliance', slug: 'compliance', description: 'KYC, regulatory flags and security reviews' },
  ];

  const teams: Record<string, { id: string; name: string; slug: string }> = {};
  for (const t of teamsData) {
    const team = await prisma.team.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
    teams[t.slug] = team;
  }
  console.log(`✅ Seeded ${Object.keys(teams).length} operational teams`);

  // 2. Users
  const usersData = [
    { email: 'admin@instos.dev', name: 'Alice Walker (Super Admin)', systemRole: SystemRole.SUPER_ADMIN, avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { email: 'lead.support@instos.dev', name: 'Sarah Chen (Support Lead)', systemRole: SystemRole.OPERATOR, avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { email: 'member.support@instos.dev', name: 'James Wilson (Support Member)', systemRole: SystemRole.OPERATOR, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { email: 'lead.payments@instos.dev', name: 'Marcus Brody (Payments Lead)', systemRole: SystemRole.OPERATOR, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    { email: 'member.payments@instos.dev', name: 'Elena Rostova (Payments Member)', systemRole: SystemRole.OPERATOR, avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
    { email: 'lead.compliance@instos.dev', name: 'David Kim (Compliance Lead)', systemRole: SystemRole.OPERATOR, avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
    { email: 'member.compliance@instos.dev', name: 'Hannah Abbott (Compliance Member)', systemRole: SystemRole.OPERATOR, avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
    { email: 'viewer@instos.dev', name: 'Victoria Vance (Viewer)', systemRole: SystemRole.OPERATOR, avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
    { email: 'system@instos.internal', name: 'instOS Dispatcher Bot', systemRole: SystemRole.SUPER_ADMIN, avatarUrl: '' },
  ];

  const users: Record<string, { id: string; email: string }> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        systemRole: u.systemRole,
        avatarUrl: u.avatarUrl,
      },
    });
    users[u.email] = user;
  }
  console.log(`✅ Seeded ${Object.keys(users).length} users`);

  // 3. Team Memberships
  const memberships = [
    // Alice is Admin in all
    { userId: users['admin@instos.dev'].id, teamId: teams['support'].id, role: TeamRole.ADMIN },
    { userId: users['admin@instos.dev'].id, teamId: teams['payments'].id, role: TeamRole.ADMIN },
    { userId: users['admin@instos.dev'].id, teamId: teams['infra'].id, role: TeamRole.ADMIN },
    { userId: users['admin@instos.dev'].id, teamId: teams['compliance'].id, role: TeamRole.ADMIN },

    // Leads & Members
    { userId: users['lead.support@instos.dev'].id, teamId: teams['support'].id, role: TeamRole.LEAD },
    { userId: users['member.support@instos.dev'].id, teamId: teams['support'].id, role: TeamRole.MEMBER },
    { userId: users['lead.payments@instos.dev'].id, teamId: teams['payments'].id, role: TeamRole.LEAD },
    { userId: users['member.payments@instos.dev'].id, teamId: teams['payments'].id, role: TeamRole.MEMBER },
    { userId: users['lead.compliance@instos.dev'].id, teamId: teams['compliance'].id, role: TeamRole.LEAD },
    { userId: users['member.compliance@instos.dev'].id, teamId: teams['compliance'].id, role: TeamRole.MEMBER },

    // Viewer has VIEWER in all teams
    { userId: users['viewer@instos.dev'].id, teamId: teams['support'].id, role: TeamRole.VIEWER },
    { userId: users['viewer@instos.dev'].id, teamId: teams['payments'].id, role: TeamRole.VIEWER },
    { userId: users['viewer@instos.dev'].id, teamId: teams['infra'].id, role: TeamRole.VIEWER },
    { userId: users['viewer@instos.dev'].id, teamId: teams['compliance'].id, role: TeamRole.VIEWER },
  ];

  for (const m of memberships) {
    await prisma.membership.upsert({
      where: { userId_teamId: { userId: m.userId, teamId: m.teamId } },
      update: { role: m.role },
      create: m,
    });
  }
  console.log(`✅ Seeded ${memberships.length} team memberships`);

  // 4. Customers
  const customersData = [
    { name: 'Acme Corp', email: 'alex@acmepayments.com', company: 'Acme Payments Inc', phone: '+1 555-0199' },
    { name: 'FastShip Co', email: 'dispatch@fastship.com', company: 'FastShip Logistics', phone: '+1 555-0244' },
    { name: 'Global Logistics', email: 'it@globallogistics.net', company: 'Global Logistics Corp', phone: '+1 555-0377' },
    { name: 'Nova Routes', email: 'contact@novaroutes.com', company: 'Nova Freight', phone: '+1 555-0488' },
  ];

  const customers: Record<string, { id: string; email: string; name: string }> = {};
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: c,
    });
    customers[c.email] = customer;
  }
  console.log(`✅ Seeded ${Object.keys(customers).length} customer profiles`);

  // 5. Sample Tickets & WorkItems
  const sampleItems = [
    {
      title: 'Discrepancy in Settlement Batch #9024 for Acme Corp',
      description: 'Acme Corp reported $72,400 settlement batch mismatch on webhook gateway. Investigation required.',
      type: WorkItemType.PAYMENT,
      priority: Priority.CRITICAL,
      status: WorkItemStatus.IN_PROGRESS,
      teamId: teams['payments'].id,
      assigneeId: users['member.payments@instos.dev'].id,
      customerEmail: 'alex@acmepayments.com',
      slaHours: 2,
    },
    {
      title: 'Urgent: Express Delivery API 502 Bad Gateway Spike',
      description: 'Shipment booking webhook endpoints returning 502s across US-East cluster.',
      type: WorkItemType.INCIDENT,
      priority: Priority.CRITICAL,
      status: WorkItemStatus.OPEN, // Unassigned Urgent!
      teamId: teams['infra'].id,
      assigneeId: null,
      customerEmail: 'dispatch@fastship.com',
      slaHours: 2,
    },
    {
      title: 'High-Risk Tier-3 KYC Verification for Enterprise Account',
      description: 'Global Logistics uploaded beneficial ownership docs. Requires compliance lead review.',
      type: WorkItemType.COMPLIANCE,
      priority: Priority.HIGH,
      status: WorkItemStatus.AWAITING_APPROVAL, // Awaiting Lead Approval!
      teamId: teams['compliance'].id,
      assigneeId: users['member.compliance@instos.dev'].id,
      customerEmail: 'it@globallogistics.net',
      slaHours: 24,
    },
    {
      title: 'Delayed Freight Tracking Webhooks on Route 402',
      description: 'Telemetry logs delayed by 45 minutes for Nova Routes fleet trucks.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: Priority.MEDIUM,
      status: WorkItemStatus.OPEN,
      teamId: teams['support'].id,
      assigneeId: null,
      customerEmail: 'contact@novaroutes.com',
      slaHours: 72,
    },
    {
      title: 'Refund Reversal Request for Charge #89201',
      description: 'Double debit confirmed by issuing bank. Awaiting customer confirmation.',
      type: WorkItemType.PAYMENT,
      priority: Priority.HIGH,
      status: WorkItemStatus.AWAITING_CUSTOMER,
      teamId: teams['payments'].id,
      assigneeId: users['member.payments@instos.dev'].id,
      customerEmail: 'alex@acmepayments.com',
      slaHours: 24,
    },
  ];

  for (const s of sampleItems) {
    const customer = customers[s.customerEmail];
    const bot = users['system@instos.internal'];
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + s.slaHours * 3600 * 1000);

    const workItem = await prisma.workItem.create({
      data: {
        title: s.title,
        description: s.description,
        type: s.type,
        priority: s.priority,
        status: s.status,
        teamId: s.teamId,
        creatorId: bot.id,
        assigneeId: s.assigneeId,
        slaDeadline,
        version: 1,
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        title: s.title,
        description: s.description,
        category: s.type,
        priority: s.priority,
        channel: TicketChannel.PORTAL,
        status: s.status,
        customerId: customer.id,
        workItemId: workItem.id,
      },
    });

    await prisma.activityEvent.create({
      data: {
        workItemId: workItem.id,
        action: ActivityAction.CREATED,
        newState: { status: s.status, priority: s.priority },
        metadata: { customerEmail: customer.email },
      },
    });

    if (s.assigneeId) {
      await prisma.comment.create({
        data: {
          workItemId: workItem.id,
          ticketId: ticket.id,
          authorId: s.assigneeId,
          isInternal: false,
          body: `Hello ${customer.name}, our operational team has taken ownership of this request and initiated diagnosis.`,
        },
      });

      await prisma.comment.create({
        data: {
          workItemId: workItem.id,
          ticketId: ticket.id,
          authorId: s.assigneeId,
          isInternal: true, // Internal Note!
          body: `Internal Note: Checked primary audit logs. No hardware degradation detected. Tracing payment gateway response codes.`,
        },
      });
    }
  }

  // 6. Default Branding Setting
  await prisma.systemSetting.upsert({
    where: { key: 'branding' },
    update: {},
    create: {
      key: 'branding',
      category: 'branding',
      value: {
        companyName: 'instOS Operations',
        primaryColor: '#4f46e5',
        supportEmail: 'support@instos.internal',
      },
    },
  });

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
