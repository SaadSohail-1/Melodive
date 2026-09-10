# Melodive Job System

Melodive uses a PostgreSQL-backed job queue for background processing.

PostgreSQL is currently used as the job queue instead of introducing a separate message broker.

## Why Database-Backed Jobs?

The application already depends on PostgreSQL, so using it for jobs provides:

- No additional infrastructure
- Transactional job creation
- Persistent jobs
- Easy inspection/debugging
- Safe concurrent workers
- Retry support

For the current project scale, PostgreSQL is sufficient.

## Job Lifecycle

A job generally follows this lifecycle:

```text
                    ┌──────────────┐
                    │    PENDING   │
                    └──────┬───────┘
                           │
                     worker claims
                           │
                           ▼
                    ┌──────────────┐
                    │  PROCESSING  │
                    └──────┬───────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
              success              error
                 │                   │
                 ▼                   ▼
          ┌────────────┐       retry available?
          │ COMPLETED  │          │
          └────────────┘       ┌───┴───┐
                               │       │
                              yes      no
                               │       │
                               ▼       ▼
                           PENDING   FAILED
```

## Job Table

Jobs are stored in the `jobs` table.

Important fields include:

| Field | Purpose |
| :--- | :--- |
| `id` | Unique job identifier |
| `type` | Type of work to perform |
| `status` | Current job state |
| `priority` | Determines processing order |
| `payload` | Input data required by the job |
| `result` | Optional successful result |
| `error_message` | Error information |
| `attempts` | Number of attempts |
| `max_retries` | Maximum retry attempts |
| `run_at` | Earliest time the job can run |
| `locked_at` | When the worker claimed it |
| `locked_by` | Worker that claimed it |
| `started_at` | Processing start time |
| `completed_at` | Completion time |
| `created_at` | Creation time |
| `updated_at` | Last update time |

## Claiming a Job

A worker should not simply perform:

```sql
SELECT * FROM jobs
WHERE status = 'PENDING'
LIMIT 1;
```

Multiple workers could select the same job. Instead, Melodive uses PostgreSQL row locking:

```sql
FOR UPDATE SKIP LOCKED
```

The worker effectively performs:

```text
Find pending job
      │
      ▼
Lock row
      │
      ▼
Mark PROCESSING
      │
      ▼
Return job
```

This happens atomically.

### `FOR UPDATE SKIP LOCKED`

* **`FOR UPDATE`**: Locks the selected row so another transaction cannot modify/claim it simultaneously.
* **`SKIP LOCKED`**: If another worker has already locked a job, the current worker skips it instead of waiting.

Example:
```text
Job 1 → PROCESSING → Worker A has lock
Job 2 → PENDING
Job 3 → PENDING

Worker B searches:
Job 1 → locked → SKIP
Job 2 → claim
```

This allows multiple workers to process jobs concurrently.

## Priority

Jobs are ordered by:
```sql
priority DESC, created_at ASC
```

Therefore:
- Higher-priority jobs run first.
- Among jobs with equal priority, older jobs run first.

## Retries

When a job fails, the worker can retry it. Conceptually:

```text
attempt 1 → failure → retry
attempt 2 → failure → retry
attempt 3 → failure → FAILED
```

- The number of attempts is tracked using `attempts`.
- `max_retries` controls how many retries are allowed.

## Delayed Jobs

`run_at` allows a job to become runnable at a future time. A worker only claims jobs where:

```sql
run_at IS NULL OR run_at <= NOW()
```

This can later be used for:
- Delayed retries
- Scheduled processing
- Exponential backoff
- Future scheduled jobs

## Worker Identification

Each worker has a `locked_by` value. This allows the system to identify which worker currently owns a job (e.g., `worker-01`, `worker-02`).

## Stale Jobs

A worker could crash while processing a job:

```text
PENDING
   ↓
PROCESSING
   ↓
Worker crashes
```

Without recovery, the job could remain stuck in `PROCESSING`. The `locked_at` timestamp exists so stale jobs can eventually be detected and recovered.

### Current Status
Stale-job recovery is planned but not implemented yet. Future recovery logic will identify jobs that have remained in `PROCESSING` for too long and return them to `PENDING`.

## Current Job Types

The worker architecture is designed around job types:
- `SCAN_LIBRARY`
- `PROCESS_ARTWORK`
- `GENERATE_WAVEFORM`
- `ANALYZE_AUDIO`

*(Not all of these are implemented yet).*

## Important Principle

A job should contain enough information in its payload to perform its work. For example:

```json
{
  "path": "/music"
}
```

could represent a `SCAN_LIBRARY` job. The worker uses the job type to determine which handler should process the payload.

## Current Implementation Status

### Implemented
- PostgreSQL-backed jobs
- Job creation
- Job claiming (`FOR UPDATE SKIP LOCKED`)
- Priority ordering
- Processing state
- Attempts tracking
- Retry mechanism foundation
- Worker identification
- Job timestamps

### Planned
- Stale job recovery
- Exponential backoff
- Better retry classification
- Job progress
- Job cancellation
- Job dependencies
- More job handlers