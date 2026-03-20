import { Queue, Worker, type JobsOptions, type WorkerOptions } from 'bullmq';

// ─── Redis Connection ───
const redisConnection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required by BullMQ
};

// ─── Default retry policy ───
const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000, // 1s, 2s, 4s
  },
  removeOnComplete: {
    age: 24 * 60 * 60, // Keep completed jobs for 24 hours
    count: 1000,
  },
  removeOnFail: false, // Keep failed jobs for DLQ inspection
};

// ─── Queue Definitions ───

/**
 * Audio Processing Queue
 * Handles: transcoding, waveform generation, metadata extraction
 * Concurrency: 2 (CPU-intensive)
 */
export const audioProcessingQueue = new Queue('audio-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s initial — audio jobs are expensive to retry
    },
  },
});

/**
 * Email Queue
 * Handles: transactional emails, notifications, welcome emails
 * Concurrency: 10
 */
export const emailQueue = new Queue('email', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

/**
 * Payout Queue
 * Handles: monthly commission payouts to creators/facilitators/outliers
 * Concurrency: 1 — SEQUENTIAL ONLY (financial transactions must not overlap)
 *
 * CRITICAL: This queue processes payouts one at a time to prevent
 * double-payments and ensure audit trail integrity.
 */
export const payoutQueue = new Queue('payout', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 1, // Payouts must NOT auto-retry — manual intervention required on failure
    removeOnFail: false, // Always keep failed payout jobs for audit
  },
});

/**
 * Scan Processing Queue
 * Handles: QR scan verification, geo-matching, TOTP validation, attribution recording
 * Concurrency: 10
 */
export const scanProcessingQueue = new Queue('scan-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 500, // Fast retry — scans are time-sensitive
    },
  },
});

/**
 * Notification Queue
 * Handles: push notifications, in-app notifications, Discord/webhook alerts
 * Concurrency: 5
 */
export const notificationQueue = new Queue('notification', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// ─── Dead Letter Queue ───

/**
 * DLQ for all failed jobs that exhaust retries.
 * Jobs are moved here for manual inspection and reprocessing.
 */
export const deadLetterQueue = new Queue('dead-letter', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
  },
});

// ─── Worker Factory ───

interface WorkerConfig {
  concurrency: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

const WORKER_CONFIGS: Record<string, WorkerConfig> = {
  'audio-processing': { concurrency: 2 },
  email: {
    concurrency: 10,
    limiter: { max: 50, duration: 60_000 }, // 50 emails per minute rate limit
  },
  payout: { concurrency: 1 }, // SEQUENTIAL ONLY
  'scan-processing': { concurrency: 10 },
  notification: { concurrency: 5 },
};

/**
 * Create a worker for a given queue with preconfigured concurrency and DLQ routing.
 *
 * @param queueName - Name of the queue to process
 * @param processor - Job processing function
 * @returns Configured BullMQ Worker instance
 */
export function createWorker<T = unknown>(
  queueName: keyof typeof WORKER_CONFIGS,
  processor: (job: { id?: string; name: string; data: T }) => Promise<void>
): Worker<T> {
  const config = WORKER_CONFIGS[queueName];

  if (!config) {
    throw new Error(`Unknown queue: ${queueName}`);
  }

  const workerOptions: WorkerOptions = {
    connection: redisConnection,
    concurrency: config.concurrency,
    limiter: config.limiter,
  };

  const worker = new Worker<T>(
    queueName,
    async (job) => {
      await processor(job);
    },
    workerOptions
  );

  // Route exhausted-retry jobs to DLQ
  worker.on('failed', async (job, error) => {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await deadLetterQueue.add(`dlq:${queueName}`, {
        originalQueue: queueName,
        jobId: job.id,
        jobName: job.name,
        jobData: job.data,
        error: error.message,
        failedAt: new Date().toISOString(),
        attempts: job.attemptsMade,
      });
      console.error(
        `[Queue:${queueName}] Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts:`,
        error.message
      );
    }
  });

  worker.on('error', (error) => {
    console.error(`[Queue:${queueName}] Worker error:`, error.message);
  });

  return worker;
}

// ─── Exports ───
export { Queue, Worker } from 'bullmq';
export type { Job } from 'bullmq';
