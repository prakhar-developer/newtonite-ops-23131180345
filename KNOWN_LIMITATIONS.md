# instOS — Known Limitations & Scope Boundaries

Per the Newtonite challenge guidance to deliver a well-considered, high-reliability vertical slice rather than half-finished features, this document outlines explicit operational boundaries:

### 1. Whole-Item Optimistic Conflict Resolution
If two operators edit different fields of the same work item concurrently (e.g., Operator A updates priority while Operator B edits description), the second submission triggers a `409 Conflict` and requires reviewing the latest snapshot. Field-level automatic three-way merges (Operational Transformation / CRDTs) are intentionally not implemented.

### 2. Polling-Based Outbox Worker vs. CDC
The transactional outbox worker polls PostgreSQL every 1.5 seconds using `FOR UPDATE SKIP LOCKED`. In extreme high-throughput environments (>10,000 events/second), combining PostgreSQL `LISTEN/NOTIFY` or Debezium Change Data Capture (CDC) into Apache Kafka would be preferred over periodic polling.

### 3. Keyset Cursor Pagination Navigation
List pagination uses indexed keyset cursor ordering on `(createdAt, id)` for constant $O(1)$ query execution at arbitrary dataset depths. While this prevents sliding-window duplicate anomalies, it does not support jumping directly to arbitrary page numbers (e.g., "Jump to Page 52").

### 4. Ephemeral Ethereal Email Mailboxes in Local Mode
When running locally without a production `RESEND_API_KEY`, emails are routed to Nodemailer Ethereal virtual mailboxes with clickable web preview links. These test mailboxes are ephemeral and intended strictly for evaluation.
