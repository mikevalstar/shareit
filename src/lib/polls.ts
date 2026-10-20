import { and, asc, eq, notInArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { newId } from "./ids";

export type Poll = typeof schema.polls.$inferSelect;

/* What the admin form and the API both resolve to before writing. Options with
   an id that belongs to the poll are kept (votes and all); the rest are new. */
export type PollInput = {
  title: string;
  description: string | null;
  slug: string;
  multi: boolean;
  closesAt: Date | null;
  options: { id?: string; content: string }[];
};

export const POLL_SLUG = /^[a-zA-Z0-9_-]{1,40}$/;

export const isClosed = (poll: Poll, now: Date) => !!poll.closesAt && poll.closesAt <= now;

export function loadOptions(pollId: string) {
  return db
    .select()
    .from(schema.pollOptions)
    .where(eq(schema.pollOptions.pollId, pollId))
    .orderBy(asc(schema.pollOptions.position))
    .all();
}

/* Per-option counts plus distinct voters — percentages are share of voters, so
   multi-choice bars can sum past 100%. */
export function loadTally(pollId: string) {
  const counts = db
    .select({ optionId: schema.pollVotes.optionId, n: sql<number>`count(*)` })
    .from(schema.pollVotes)
    .where(eq(schema.pollVotes.pollId, pollId))
    .groupBy(schema.pollVotes.optionId)
    .all();
  const voters =
    db
      .select({ n: sql<number>`count(distinct ${schema.pollVotes.voterId})` })
      .from(schema.pollVotes)
      .where(eq(schema.pollVotes.pollId, pollId))
      .get()?.n ?? 0;
  return { counts: new Map(counts.map((c) => [c.optionId, c.n])), voters };
}

export function loadVoterRows(pollId: string) {
  const rows = db
    .select({
      voterId: schema.pollVotes.voterId,
      name: schema.voters.name,
      optionId: schema.pollVotes.optionId,
      createdAt: schema.pollVotes.createdAt,
    })
    .from(schema.pollVotes)
    .innerJoin(schema.voters, eq(schema.voters.id, schema.pollVotes.voterId))
    .where(eq(schema.pollVotes.pollId, pollId))
    .all();
  const byVoter = new Map<string, { name: string; optionIds: Set<string>; votedAt: Date }>();
  for (const r of rows) {
    const v = byVoter.get(r.voterId) ?? {
      name: r.name,
      optionIds: new Set(),
      votedAt: r.createdAt,
    };
    v.optionIds.add(r.optionId);
    if (r.createdAt > v.votedAt) v.votedAt = r.createdAt;
    byVoter.set(r.voterId, v);
  }
  return [...byVoter.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function slugTaken(slug: string, exceptId?: string) {
  const row = db
    .select({ id: schema.polls.id })
    .from(schema.polls)
    .where(eq(schema.polls.slug, slug))
    .get();
  return !!row && row.id !== exceptId;
}

/* Creates the poll when id is omitted; otherwise rewrites it and its option list. */
export function savePoll(input: PollInput, id?: string): string {
  const pollId = id ?? newId();
  const ownIds = new Set(id ? loadOptions(id).map((o) => o.id) : []);
  const options = input.options.map((o) => {
    const kept = !!o.id && ownIds.has(o.id);
    return { id: kept && o.id ? o.id : newId(), kept, content: o.content };
  });
  const fields = {
    slug: input.slug,
    title: input.title,
    description: input.description,
    multi: input.multi,
    closesAt: input.closesAt,
  };

  db.transaction((tx) => {
    if (id) {
      tx.update(schema.polls).set(fields).where(eq(schema.polls.id, id)).run();
      // Removed options take their votes with them (FK cascade).
      tx.delete(schema.pollOptions)
        .where(
          and(
            eq(schema.pollOptions.pollId, id),
            notInArray(
              schema.pollOptions.id,
              options.map((o) => o.id),
            ),
          ),
        )
        .run();
    } else {
      tx.insert(schema.polls)
        .values({ id: pollId, ...fields })
        .run();
    }
    options.forEach((o, position) => {
      if (o.kept) {
        tx.update(schema.pollOptions)
          .set({ content: o.content, position })
          .where(eq(schema.pollOptions.id, o.id))
          .run();
      } else {
        tx.insert(schema.pollOptions)
          .values({ id: o.id, pollId, content: o.content, position })
          .run();
      }
    });
  });
  return pollId;
}
