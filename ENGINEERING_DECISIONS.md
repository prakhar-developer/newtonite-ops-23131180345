# instOS — Engineering Decisions & Architectural Trade-offs

This document outlines the context, evaluated alternatives, concrete technical choices, and deliberate trade-offs made during the design and implementation of **instOS** (Instant Operations & Customer Support Platform).

---

## 1. Dual-Surface Architecture: Public Ingestion Hub vs. Internal Operator Desk

### Context
In real-world enterprise operations, over 90% of urgent work items (payment discrepancies, system outages, KYC compliance flags, and billing disputes) originate from **external customers and partner websites**, rather than internal operators manually creating dummy tickets. Existing solutions often treat operational workflows in a silo, isolating operators from customers.

### Options Considered
1. **Closed Internal-Only Loop**: Operators manually type tickets into an internal portal.
   - *Limitation:* Does not reflect realistic operational lifecycles; lacks customer tracking and feedback loops.
2. **Dedicated Separate SaaS Products**: Integrate an external Zendesk instance into an internal tool via webhooks.
   - *Limitation:* High integration friction, dual sources of truth, fragmented audit history.
3. **Unified Dual-Surface Architecture (Chosen)**:
   - **External Customer Hub (`/portal`) & Embeddable Widget (`widget.js`)**: Public submission with tracking token and CSAT feedback.
   - **Internal Operator Command Center (`/ops`)**: Team triage, atomic claim, and dual-mode commenting (public replies vs. private internal notes).

### Trade-off
Requires maintaining visibility boundaries (`isInternal` boolean flag in `Comment` model) to ensure private operator deliberation is never leaked to customers. This adds minor schema logic while delivering an end-to-end feedback loop.

---

## 2. Concurrency Strategy: Atomic Claims & Optimistic Version Locking

### Context
In high-stress operational environments, multiple operators view unassigned urgent items simultaneously. Without concurrency safeguards, two operators can double-claim an item, or an operator with stale screen data can overwrite changes made seconds earlier.

### Options Considered
1. **Pessimistic Row Locking (`SELECT FOR UPDATE`)**:
   - *Limitation:* Holding database locks across network latency and human reading time exhausts connection pools and degrades throughput.
2. **First-Write-Wins with Optimistic Locking (Chosen for Edits & Transitions)**:
   - Compare-and-swap on an incrementing integer `version` (`WHERE id = :id AND version = :version`).
3. **Atomic Conditional Updates (Chosen for Claims)**:
   ```sql
   UPDATE work_items
   SET assignee_id = :user_id, status = 'IN_PROGRESS', version = version + 1
   WHERE id = :item_id AND assignee_id IS NULL;
   ```

### Technical Choice
- **Atomic Claiming:** Uses atomic conditional updates. If two operators click "Claim" at the exact same millisecond, exactly one query matches `assignee_id IS NULL` and updates 1 row (`200 OK`); the colliding query updates 0 rows and immediately returns `409 Conflict`.
- **Optimistic Locking:** Edits and workflow transitions submit the `version` seen by the client. Version mismatches return `409 Conflict` with the latest record snapshot, triggering the frontend conflict resolution drawer.

### Trade-off
Operators occasionally encounter a conflict drawer requiring them to reload rather than silently overwriting a colleague's work, which is the intended correctness guarantee.

---

## 3. Zero-Friction Cloud Integrations with Local Simulation Fallbacks

### Context
The platform is engineered for deployment on **Railway (Backend/DB) and Vercel (Frontend)** with **Resend (Email), Cloudinary (Attachments), and Upstash (Redis)**. However, reviewers and automated CI environments must be able to clone and run the application with **zero external API keys** without encountering startup failures.

### Options Considered
1. **Mandatory Third-Party Accounts**: Require reviewers to register for Resend and Cloudinary before testing.
   - *Limitation:* Unacceptable evaluation friction.
2. **Dual-Mode Pluggable Services (Chosen)**:
   - **Email Service:** If `RESEND_API_KEY` is present, dispatches real emails via Resend. If omitted, automatically spins up an ephemeral **Nodemailer Ethereal** test mailbox and logs clickable browser preview URLs (`https://ethereal.email/...`).
   - **Upload Service:** If Cloudinary credentials are provided, streams images to Cloudinary CDN. If omitted, stores files in a local `/uploads` directory.
   - **Outbox Poller:** Uses PostgreSQL `SKIP LOCKED` polling, eliminating mandatory Redis dependencies.

### Trade-off
Introduces minor adapter abstraction layers in `EmailService` and `UploadService`, but guarantees 100% offline local evaluability while remaining cloud-deployable.

---

## 4. Transactional Outbox Pattern for Asynchronous Reliability

### Context
Operational compliance demands that secondary side-effects (customer notification emails, webhook dispatches, and SLA escalation alerts) execute reliably without blocking HTTP request loops or causing partial failures.

### Options Considered
1. **Synchronous In-Request Dispatch**:
   - *Limitation:* High HTTP latency; if external notification gateways fail, user mutations fail.
2. **Dual Writes via External Message Broker (RabbitMQ/Kafka)**:
   - *Limitation:* If the database commit succeeds but message publishing fails, events are lost.
3. **Transactional Outbox Table with Polling Daemon (Chosen)**:
   - Enqueue jobs into an `outbox_jobs` table inside the **exact same PostgreSQL transaction** as the entity mutation.

### Technical Choice
An asynchronous `OutboxWorker` polls pending jobs using:
- Atomic conditional lease updates (`status = 'PROCESSING', attempts = attempts + 1`).
- Exponential backoff calculation: `nextRetryAt = NOW() + 2^attempts * 1000ms`.
- Terminal Dead-Letter Queue (DLQ) after 5 failed attempts (`status = 'DEAD_LETTER'`) with captured error traces.
- Crash lease recovery: reclaims jobs left in `PROCESSING` status for over 5 minutes.

### Trade-off
Introduces a ~1.5-second polling interval between mutation and dispatch, but eliminates ghost notifications and guarantees zero event loss on system restarts.

---

## 5. Server-Enforced RBAC & Resource-Level Isolation (404 vs 403)

### Context
Internal operations tools must enforce authorization at the service layer rather than relying on cosmetic UI button hiding. Operators belong to multiple functional teams with different responsibilities (e.g. Lead in Payments, but merely Viewer in Customer Support).

### Options Considered
1. **Global User Roles (e.g. Global Admin / Global User)**:
   - *Limitation:* Unrealistic for cross-functional operations. A Payments Lead should not be authorized to approve compliance filings without explicit membership.
2. **Team-Scoped Roles with Centralized Policy Guards (Chosen)**:
   - `memberships` table maps `(userId, teamId, role)` where `role ∈ {VIEWER, MEMBER, LEAD, ADMIN}`.
   - Resource-level checks: Probing an item in a team where the user has no membership returns **`404 Not Found`** (preventing resource enumeration attacks).
   - Insufficient role within a team returns **`403 Forbidden`**.
   - **Four-Eyes Approval Gate:** Advancing from `AWAITING_APPROVAL` to `RESOLVED` strictly requires `LEAD` or `ADMIN`, and **the current assignee cannot approve their own work**.

### Trade-off
Requires loading team memberships on protected requests (indexed point lookups in PostgreSQL). Guarantees complete data isolation between functional departments.
