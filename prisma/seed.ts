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
    { name: 'Zenith Retail', email: 'support@zenithretail.com', company: 'Zenith E-Commerce', phone: '+1 555-0811' },
    { name: 'HyperPay Ltd', email: 'ops@hyperpay.io', company: 'HyperPay FinTech', phone: '+1 555-0922' },
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

  // 5. Rich Multi-Team Operational Work Items Dataset
  const rawItems = [
    // --- PAYMENTS OPERATIONS (9 items) ---
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
      title: 'High-Volume Chargeback Dispute: 42 Unauthorized Transactions',
      description: 'Card network flagged 42 chargeback requests from issuer bank BIN 411111. Dispute evidence required.',
      type: WorkItemType.PAYMENT,
      priority: Priority.URGENT,
      status: WorkItemStatus.OPEN, // Unassigned Urgent!
      teamId: teams['payments'].id,
      assigneeId: null,
      customerEmail: 'ops@hyperpay.io',
      slaHours: 6,
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
    {
      title: 'Merchant Payout Hold: HyperPay Account #HP-9912',
      description: 'Automated velocity trigger suspended outbound wire payout of $140,000 pending Lead Four-Eyes approval.',
      type: WorkItemType.PAYMENT,
      priority: Priority.HIGH,
      status: WorkItemStatus.AWAITING_APPROVAL, // Awaiting Lead Approval!
      teamId: teams['payments'].id,
      assigneeId: users['member.payments@instos.dev'].id,
      customerEmail: 'ops@hyperpay.io',
      slaHours: 24,
    },
    {
      title: 'Currency Exchange Rate Deviation on EUR/USD Corridor',
      description: 'FX provider quotes diverged by 1.8% during market open. Reconciliation complete.',
      type: WorkItemType.PAYMENT,
      priority: Priority.MEDIUM,
      status: WorkItemStatus.RESOLVED,
      teamId: teams['payments'].id,
      assigneeId: users['lead.payments@instos.dev'].id,
      customerEmail: 'alex@acmepayments.com',
      slaHours: 48,
    },
    {
      title: 'Duplicate Fee Deduction on Monthly Invoicing Cycle',
      description: 'Customer noticed dual fee line item for March SaaS subscription.',
      type: WorkItemType.PAYMENT,
      priority: Priority.LOW,
      status: WorkItemStatus.CLOSED,
      teamId: teams['payments'].id,
      assigneeId: users['member.payments@instos.dev'].id,
      customerEmail: 'support@zenithretail.com',
      slaHours: 72,
    },
    {
      title: 'Stripe Direct Gateway 429 Rate Limit Spike',
      description: 'Sudden spike in HTTP 429 Too Many Requests on payment intent capture endpoint.',
      type: WorkItemType.PAYMENT,
      priority: Priority.CRITICAL,
      status: WorkItemStatus.OPEN,
      teamId: teams['payments'].id,
      assigneeId: null,
      customerEmail: 'ops@hyperpay.io',
      slaHours: -2, // Breached SLA!
    },
    {
      title: 'Manual Wire Reconciliation: Reference #WIRE-7739',
      description: 'Unmatched incoming wire of $23,500 with missing reference code.',
      type: WorkItemType.PAYMENT,
      priority: Priority.MEDIUM,
      status: WorkItemStatus.IN_PROGRESS,
      teamId: teams['payments'].id,
      assigneeId: users['lead.payments@instos.dev'].id,
      customerEmail: 'alex@acmepayments.com',
      slaHours: 36,
    },
    {
      title: 'High-Value Card Transaction Escalation ($85,000)',
      description: 'Custom risk rule triggered on cross-border corporate debit.',
      type: WorkItemType.PAYMENT,
      priority: Priority.HIGH,
      status: WorkItemStatus.AWAITING_APPROVAL,
      teamId: teams['payments'].id,
      assigneeId: users['member.payments@instos.dev'].id,
      customerEmail: 'ops@hyperpay.io',
      slaHours: 12,
    },

    // --- INFRASTRUCTURE & RELIABILITY (9 items) ---
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
      title: 'Primary PostgreSQL Database Connection Pool Saturation',
      description: 'Active connections peaked at 98% of pool capacity during peak ingestion window.',
      type: WorkItemType.INCIDENT,
      priority: Priority.CRITICAL,
      status: WorkItemStatus.IN_PROGRESS,
      teamId: teams['infra'].id,
      assigneeId: users['admin@instos.dev'].id,
      customerEmail: 'dispatch@fastship.com',
      slaHours: 2,
    },
    {
      title: 'Redis Cluster Memory Pressure & Key Eviction Spike',
      description: 'Eviction rate exceeded 5,000 keys/sec on cache cluster node 2.',
      type: WorkItemType.INCIDENT,
      priority: Priority.HIGH,
      status: WorkItemStatus.IN_PROGRESS,
      teamId: teams['infra'].id,
      assigneeId: users['admin@instos.dev'].id,
      customerEmail: 'it@globallogistics.net',
      slaHours: 6,
    },
    {
      title: 'SSL Wildcard Certificate Renewal for *.instos.internal',
      description: 'Automated Let’s Encrypt renewal failed due to DNS CAA record restriction.',
      type: WorkItemType.TASK,
      priority: Priority.URGENT,
      status: WorkItemStatus.AWAITING_APPROVAL, // Awaiting Lead Approval!
      teamId: teams['infra'].id,
      assigneeId: users['admin@instos.dev'].id,
      customerEmail: 'it@globallogistics.net',
      slaHours: 12,
    },
    {
      title: 'Kafka Consumer Group Lag Exceeding Threshold (Partition 4)',
      description: 'Outbox event consumer lag reached 42,000 unread messages.',
      type: WorkItemType.INCIDENT,
      priority: Priority.HIGH,
      status: WorkItemStatus.OPEN,
      teamId: teams['infra'].id,
      assigneeId: null,
      customerEmail: 'dispatch@fastship.com',
      slaHours: -5, // Breached SLA!
    },
    {
      title: 'Kubernetes Ingress Controller Rolling Restart Required',
      description: 'Memory leak in envoy proxy sidecar necessitates rolling deployment.',
      type: WorkItemType.TASK,
      priority: Priority.MEDIUM,
      status: WorkItemStatus.RESOLVED,
      teamId: teams['infra'].id,
      assigneeId: users['admin@instos.dev'].id,
      customerEmail: 'dispatch@fastship.com',
      slaHours: 24,
    },
    {
      title: 'Prometheus Alert: Disk Utilization > 85% on /var/log Volume',
      description: 'Log rotation daemon stalled on worker node 04.',
      type: WorkItemType.TASK,
      priority: Priority.LOW,
      status: WorkItemStatus.CLOSED,
      teamId: teams['infra'].id,
      assigneeId: users['admin@instos.dev'].id,
      customerEmail: 'it@globallogistics.net',
      slaHours: 48,
    },
    {
      title: 'Elasticsearch Index Shard Unassigned on Health Cluster',
      description: 'Yellow cluster health reported due to 2 unassigned replica shards.',
      type: WorkItemType.INCIDENT,
      priority: Priority.MEDIUM,
      status: WorkItemStatus.OPEN,
      teamId: teams['infra'].id,
      assigneeId: null,
      customerEmail: 'dispatch@fastship.com',
      slaHours: 24,
    },
    {
      title: 'CDN Cache Purge Failure for Static Portal Assets',
      description: 'Edge points in AP-South-1 serving stale JavaScript bundle.',
      type: WorkItemType.INCIDENT,
      priority: Priority.HIGH,
      status: WorkItemStatus.IN_PROGRESS,
      teamId: teams['infra'].id,
      assigneeId: users['admin@instos.dev'].id,
      customerEmail: 'it@globallogistics.net',
      slaHours: 8,
    },

    // --- TRUST & COMPLIANCE (9 items) ---
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
      title: 'Politically Exposed Person (PEP) Match on Corporate Director',
      description: 'Automated WorldCheck sanctions screener flagged Director Name match.',
      type: WorkItemType.COMPLIANCE,
      priority: Priority.CRITICAL,
      status: WorkItemStatus.IN_PROGRESS,
      teamId: teams['compliance'].id,
      assigneeId: users['lead.compliance@instos.dev'].id,
      customerEmail: 'it@globallogistics.net',
      slaHours: 4,
    },
    {
      title: 'GDPR Right to Be Forgotten: Data Erasure Request #GDPR-441',
      description: 'Customer exercised Art 17 erasure. Anonymization required across analytics warehouse.',
      type: WorkItemType.COMPLIANCE,
      priority: Priority.URGENT,
      status: WorkItemStatus.OPEN,
      teamId: teams['compliance'].id,
      assigneeId: null,
      customerEmail: 'support@zenithretail.com',
      slaHours: 48,
    },
    {
      title: 'Suspicious Activity Report (SAR) Filing Review: Account #9011',
      description: 'Rapid structuring pattern detected. Three transactions just under $10k threshold.',
      type: WorkItemType.COMPLIANCE,
      priority: Priority.HIGH,
      status: WorkItemStatus.AWAITING_APPROVAL,
      teamId: teams['compliance'].id,
      assigneeId: users['member.compliance@instos.dev'].id,
      customerEmail: 'it@globallogistics.net',
      slaHours: 24,
    },
    {
      title: 'Annual SOC-2 Access Control Policy Audit Signoff',
      description: 'Quarterly review of superadmin access logs and role revocations.',
      type: WorkItemType.COMPLIANCE,
      priority: Priority.MEDIUM,
      status: WorkItemStatus.RESOLVED,
      teamId: teams['compliance'].id,
      assigneeId: users['lead.compliance@instos.dev'].id,
      customerEmail: 'it@globallogistics.net',
      slaHours: 72,
    },
    {
      title: 'Sanctions List OFAC SDN Match False Positive Clearance',
      description: 'Name similarity flagged. Birth date and passport verified mismatched.',
      type: WorkItemType.COMPLIANCE,
      priority: Priority.HIGH,
      status: WorkItemStatus.CLOSED,
      teamId: teams['compliance'].id,
      assigneeId: users['member.compliance@instos.dev'].id,
      customerEmail: 'it@globallogistics.net',
      slaHours: 24,
    },
    {
      title: 'Data Processing Agreement (DPA) Review for Zenith Retail',
      description: 'Custom liability clause modifications submitted by corporate legal counsel.',
      type: WorkItemType.COMPLIANCE,
      priority: Priority.MEDIUM,
      status: WorkItemStatus.AWAITING_CUSTOMER,
      teamId: teams['compliance'].id,
      assigneeId: users['member.compliance@instos.dev'].id,
      customerEmail: 'support@zenithretail.com',
      slaHours: 48,
    },
    {
      title: 'Expired Corporate Registration Certificate on File',
      description: 'Trade license expired on October 1st. Automated re-verification triggered.',
      type: WorkItemType.COMPLIANCE,
      priority: Priority.LOW,
      status: WorkItemStatus.OPEN,
      teamId: teams['compliance'].id,
      assigneeId: null,
      customerEmail: 'support@zenithretail.com',
      slaHours: -12, // Breached SLA!
    },
    {
      title: 'Cross-Border Tax Residency Self-Certification Audit',
      description: 'W-8BEN-E tax forms require operational cross-referencing against invoice entries.',
      type: WorkItemType.COMPLIANCE,
      priority: Priority.LOW,
      status: WorkItemStatus.IN_PROGRESS,
      teamId: teams['compliance'].id,
      assigneeId: users['member.compliance@instos.dev'].id,
      customerEmail: 'it@globallogistics.net',
      slaHours: 96,
    },

    // --- CUSTOMER SUPPORT (9 items) ---
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
      title: 'Account Lockout: Too Many Incorrect Password Attempts',
      description: 'Executive user locked out after mobile app credential sync error.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: Priority.HIGH,
      status: WorkItemStatus.IN_PROGRESS,
      teamId: teams['support'].id,
      assigneeId: users['member.support@instos.dev'].id,
      customerEmail: 'contact@novaroutes.com',
      slaHours: 4,
    },
    {
      title: 'Single Sign-On (SAML) Metadata Certificate Expiry',
      description: 'Okta SSO federation giving certificate validation failure for employee portal.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: Priority.CRITICAL,
      status: WorkItemStatus.IN_PROGRESS,
      teamId: teams['support'].id,
      assigneeId: users['lead.support@instos.dev'].id,
      customerEmail: 'support@zenithretail.com',
      slaHours: 2,
    },
    {
      title: 'CSV Bulk Shipment Upload Failing with Parser Error',
      description: 'Customer uploading 2,000 line manifest getting silent error on row 142.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: Priority.MEDIUM,
      status: WorkItemStatus.AWAITING_CUSTOMER,
      teamId: teams['support'].id,
      assigneeId: users['member.support@instos.dev'].id,
      customerEmail: 'contact@novaroutes.com',
      slaHours: 24,
    },
    {
      title: 'Custom Webhook Endpoint IP Whitelisting Request',
      description: 'Firewall team requires static CIDR ranges for outbound webhook delivery.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: Priority.LOW,
      status: WorkItemStatus.RESOLVED,
      teamId: teams['support'].id,
      assigneeId: users['member.support@instos.dev'].id,
      customerEmail: 'dispatch@fastship.com',
      slaHours: 48,
    },
    {
      title: 'Billing Contact Update for Quarterly Invoice Dispatch',
      description: 'Accounts payable email changed from ap@fastship.com to finance@fastship.com.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: Priority.LOW,
      status: WorkItemStatus.CLOSED,
      teamId: teams['support'].id,
      assigneeId: users['member.support@instos.dev'].id,
      customerEmail: 'dispatch@fastship.com',
      slaHours: 48,
    },
    {
      title: 'Delivery Status SMS Notification Delivery Failure in EU',
      description: 'Twilio SMS sender ID unregistered for German mobile carriers (+49).',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: Priority.HIGH,
      status: WorkItemStatus.OPEN,
      teamId: teams['support'].id,
      assigneeId: null,
      customerEmail: 'contact@novaroutes.com',
      slaHours: -8, // Breached SLA!
    },
    {
      title: 'Request for Extended API Rate Limits (5,000 req/min)',
      description: 'Zenith Retail preparing for Black Friday traffic surge. Tier upgrade approval required.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: Priority.HIGH,
      status: WorkItemStatus.AWAITING_APPROVAL, // Awaiting Lead Approval!
      teamId: teams['support'].id,
      assigneeId: users['member.support@instos.dev'].id,
      customerEmail: 'support@zenithretail.com',
      slaHours: 24,
    },
    {
      title: 'Multi-Factor Authenticator (MFA) Reset Request',
      description: 'Operator lost physical security key. Identity confirmed via manager phone verification.',
      type: WorkItemType.CUSTOMER_ISSUE,
      priority: Priority.MEDIUM,
      status: WorkItemStatus.IN_PROGRESS,
      teamId: teams['support'].id,
      assigneeId: users['lead.support@instos.dev'].id,
      customerEmail: 'contact@novaroutes.com',
      slaHours: 12,
    },
  ];

  // Clean old sample items to ensure deterministic re-seeding
  await prisma.comment.deleteMany({});
  await prisma.activityEvent.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.workItem.deleteMany({});

  console.log(`🧹 Cleared old work items for fresh seed`);

  const bot = users['system@instos.internal'];
  const now = new Date();

  for (const s of rawItems) {
    const customer = customers[s.customerEmail] || customers['alex@acmepayments.com'];
    const slaDeadline = new Date(now.getTime() + s.slaHours * 3600 * 1000);
    const slaBreached = s.slaHours < 0;

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
        slaBreached,
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
          body: `Internal Note: Checked primary audit logs. Operational workflow is progressing as expected.`,
        },
      });
    }
  }

  console.log(`✅ Seeded ${rawItems.length} rich operational work items across 4 teams`);

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
        supportEmail: 'support@inistnt.in',
      },
    },
  });

  console.log('🎉 Deterministic enterprise seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
