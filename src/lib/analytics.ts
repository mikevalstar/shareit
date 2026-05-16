import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export type EventKind = "shortlink" | "file" | "snippet";

export type EventStats = {
  views: number;
  spark: number[];
};

type ResourceRef = {
  kind: EventKind;
  id: string;
};

const dayExpr = sql<string>`strftime('%Y-%m-%d', ${schema.events.createdAt}, 'unixepoch')`;

export function dayKeys(now: Date, days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export function eventStatsForKind(
  kind: EventKind,
  resourceIds: string[],
  now: Date,
  days = 7,
): Map<string, EventStats> {
  if (resourceIds.length === 0) return new Map();

  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const buckets = db
    .select({
      resourceId: schema.events.resourceId,
      day: dayExpr,
      n: sql<number>`count(*)`,
    })
    .from(schema.events)
    .where(
      and(
        eq(schema.events.kind, kind),
        gte(schema.events.createdAt, since),
        inArray(schema.events.resourceId, resourceIds),
      ),
    )
    .groupBy(schema.events.resourceId, dayExpr)
    .all();

  const totals = db
    .select({ resourceId: schema.events.resourceId, n: sql<number>`count(*)` })
    .from(schema.events)
    .where(and(eq(schema.events.kind, kind), inArray(schema.events.resourceId, resourceIds)))
    .groupBy(schema.events.resourceId)
    .all();

  const daysList = dayKeys(now, days);
  const byResource = new Map<string, Map<string, number>>();
  for (const b of buckets) {
    if (!byResource.has(b.resourceId)) byResource.set(b.resourceId, new Map());
    byResource.get(b.resourceId)!.set(b.day, b.n);
  }

  const stats = new Map<string, EventStats>();
  for (const t of totals) {
    const resourceBuckets = byResource.get(t.resourceId) ?? new Map<string, number>();
    stats.set(t.resourceId, {
      views: t.n,
      spark: daysList.map((d) => resourceBuckets.get(d) ?? 0),
    });
  }
  for (const id of resourceIds) {
    if (!stats.has(id)) stats.set(id, { views: 0, spark: daysList.map(() => 0) });
  }
  return stats;
}

export function eventStatsForResources(
  resources: ResourceRef[],
  now: Date,
  days = 7,
): Map<string, EventStats> {
  if (resources.length === 0) return new Map();

  const ids = resources.map((r) => r.id);
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const buckets = db
    .select({
      kind: schema.events.kind,
      resourceId: schema.events.resourceId,
      day: dayExpr,
      n: sql<number>`count(*)`,
    })
    .from(schema.events)
    .where(and(gte(schema.events.createdAt, since), inArray(schema.events.resourceId, ids)))
    .groupBy(schema.events.kind, schema.events.resourceId, dayExpr)
    .all();

  const totals = db
    .select({
      kind: schema.events.kind,
      resourceId: schema.events.resourceId,
      n: sql<number>`count(*)`,
    })
    .from(schema.events)
    .where(inArray(schema.events.resourceId, ids))
    .groupBy(schema.events.kind, schema.events.resourceId)
    .all();

  const daysList = dayKeys(now, days);
  const byResource = new Map<string, Map<string, number>>();
  for (const b of buckets) {
    const key = eventKey(b.kind, b.resourceId);
    if (!byResource.has(key)) byResource.set(key, new Map());
    byResource.get(key)!.set(b.day, b.n);
  }

  const stats = new Map<string, EventStats>();
  for (const t of totals) {
    const key = eventKey(t.kind, t.resourceId);
    const resourceBuckets = byResource.get(key) ?? new Map<string, number>();
    stats.set(key, {
      views: t.n,
      spark: daysList.map((d) => resourceBuckets.get(d) ?? 0),
    });
  }
  for (const r of resources) {
    const key = eventKey(r.kind, r.id);
    if (!stats.has(key)) stats.set(key, { views: 0, spark: daysList.map(() => 0) });
  }
  return stats;
}

export function eventDayTotals(now: Date, days: number): number[] {
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const totals = db
    .select({ day: dayExpr, n: sql<number>`count(*)` })
    .from(schema.events)
    .where(gte(schema.events.createdAt, since))
    .groupBy(dayExpr)
    .all();
  const byDay = new Map(totals.map((d) => [d.day, d.n]));
  return dayKeys(now, days).map((d) => byDay.get(d) ?? 0);
}

export function eventKey(kind: string, id: string): string {
  return `${kind}:${id}`;
}
