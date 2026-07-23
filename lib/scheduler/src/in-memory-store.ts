import type {
  ScheduledJob,
  ScheduledJobListQuery,
  ScheduledJobRun,
  ScheduledJobRunListQuery,
  ScheduledJobRunStore,
  ScheduledJobStore,
} from "./types.js";

/** In-memory scheduled job store for unit tests and local scripts. The api-server always wires up `DrizzleScheduledJobStore`. */
export class InMemoryScheduledJobStore implements ScheduledJobStore {
  private readonly jobs = new Map<string, ScheduledJob>();

  async insert(job: ScheduledJob): Promise<ScheduledJob> {
    this.jobs.set(job.id, { ...job });
    return { ...job };
  }

  async update(id: string, job: ScheduledJob): Promise<ScheduledJob | null> {
    if (!this.jobs.has(id)) return null;
    this.jobs.set(id, { ...job });
    return { ...job };
  }

  async delete(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getById(id: string): Promise<ScheduledJob | null> {
    const job = this.jobs.get(id);
    return job ? { ...job } : null;
  }

  async list(query: ScheduledJobListQuery): Promise<ScheduledJob[]> {
    let results = Array.from(this.jobs.values());
    if (query.status) results = results.filter((j) => j.status === query.status);
    if (query.userId) results = results.filter((j) => j.userId === query.userId);
    results.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 200;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 1000)).map((j) => ({ ...j }));
  }
}

/** In-memory scheduled job run store for unit tests and local scripts. The api-server always wires up `DrizzleScheduledJobRunStore`. */
export class InMemoryScheduledJobRunStore implements ScheduledJobRunStore {
  private readonly runs = new Map<string, ScheduledJobRun>();

  async insert(run: ScheduledJobRun): Promise<ScheduledJobRun> {
    this.runs.set(run.id, { ...run });
    return { ...run };
  }

  async getById(id: string): Promise<ScheduledJobRun | null> {
    const run = this.runs.get(id);
    return run ? { ...run } : null;
  }

  async list(query: ScheduledJobRunListQuery): Promise<ScheduledJobRun[]> {
    let results = Array.from(this.runs.values());
    if (query.jobId) results = results.filter((r) => r.jobId === query.jobId);
    if (query.status) results = results.filter((r) => r.status === query.status);
    results.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    const safeLimit = typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    return results.slice(0, Math.min(Math.max(safeLimit, 1), 500)).map((r) => ({ ...r }));
  }
}
