import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// Serializes all reads/writes per file so concurrent requests in dev don't
// interleave a read-modify-write and clobber each other's changes — there's
// no real DB transaction to lean on with a flat JSON file.
const queues = new Map<string, Promise<unknown>>();

function enqueue<T>(file: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(file) ?? Promise.resolve();
  const next = previous.then(task, task);
  queues.set(
    file,
    next.catch(() => undefined)
  );
  return next;
}

async function ensureFile(fullPath: string): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(fullPath);
  } catch {
    await fs.writeFile(fullPath, "[]", "utf8");
  }
}

async function readFileRaw<T>(file: string): Promise<T[]> {
  const fullPath = path.join(DATA_DIR, file);
  await ensureFile(fullPath);
  const raw = await fs.readFile(fullPath, "utf8");
  return raw.trim() ? (JSON.parse(raw) as T[]) : [];
}

async function writeFileRaw<T>(file: string, data: T[]): Promise<void> {
  const fullPath = path.join(DATA_DIR, file);
  await ensureFile(fullPath);
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), "utf8");
}

export function readCollection<T>(file: string): Promise<T[]> {
  return enqueue(file, () => readFileRaw<T>(file));
}

// Read-modify-write as a single queued step, so two mutations of the same
// collection can never race each other.
export function withCollection<T>(
  file: string,
  mutate: (data: T[]) => T[] | Promise<T[]>
): Promise<T[]> {
  return enqueue(file, async () => {
    const current = await readFileRaw<T>(file);
    const updated = await mutate(current);
    await writeFileRaw(file, updated);
    return updated;
  });
}
