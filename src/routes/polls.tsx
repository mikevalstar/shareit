import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { getCookie } from "hono/cookie";
import { z } from "zod";
import { db, schema } from "@/db";
import { eventStatsForKind } from "@/lib/analytics";
import { isAuthed, requireAuth } from "@/lib/auth";
import { fullUrl, siteUrl } from "@/lib/config";
import { newId, newSlug } from "@/lib/ids";
import { plainText, renderInline, renderMarkdown } from "@/lib/markdown";
import { renderPollCard, renderPollResults } from "@/lib/og-image";
import { buildPageMeta, likePattern, readPageQuery } from "@/lib/pagination";
import {
  isClosed,
  loadOptions,
  loadTally,
  loadVoterRows,
  POLL_SLUG,
  type Poll,
  savePoll,
  slugTaken,
} from "@/lib/polls";
import { requireShareKey } from "@/lib/share-key";
import { track } from "@/lib/track";
import { VOTER_COOKIE, writeVoterCookie } from "@/lib/voter";
import {
  PollForm,
  type PollFormValues,
  PollResults,
  type PollRow,
  Polls,
  PollView,
} from "@/views/pages";
import { pollStatus } from "@/views/pages/poll-view";

// ─── Admin ──────────────────────────────────────────────────────────────────

export const pollsAdmin = new Hono();
pollsAdmin.use("*", requireAuth);

const pollFormSchema = z.object({
  title: z.string().trim().min(1, "A question is required").max(200),
  description: z.string().max(10_000).default(""),
  slug: z
    .string()
    .trim()
    .regex(POLL_SLUG, "Slug can only use letters, numbers, - and _")
    .or(z.literal(""))
    .default(""),
  multi: z.enum(["0", "1"]).default("0"),
  closesAt: z.iso.datetime().or(z.literal("")).default(""),
});

type ParsedPoll = Omit<PollFormValues, "id" | "options"> & {
  options: { id?: string; content: string }[];
};

function parsePollForm(
  form: Record<string, string | File | (string | File)[]>,
): { ok: true; poll: ParsedPoll } | { ok: false; error: string; values: PollFormValues } {
  const str = (k: string) => (typeof form[k] === "string" ? (form[k] as string) : "");
  const indices = new Set<number>();
  for (const key of Object.keys(form)) {
    const m = key.match(/^options\[(\d+)]\[(id|content)]$/);
    if (m) indices.add(Number(m[1]));
  }
  const options = [...indices]
    .sort((a, b) => a - b)
    .map((i) => ({
      id: str(`options[${i}][id]`) || undefined,
      content: str(`options[${i}][content]`).trim(),
    }))
    .filter((o) => o.content);

  const parsed = pollFormSchema.safeParse({
    title: str("title"),
    description: str("description"),
    slug: str("slug"),
    multi: str("multi") || undefined,
    closesAt: str("closesAt"),
  });
  const values: PollFormValues = {
    title: str("title"),
    description: str("description"),
    slug: str("slug"),
    multi: str("multi") === "1",
    closesAt: parsed.success && parsed.data.closesAt ? new Date(parsed.data.closesAt) : null,
    options,
  };
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", values };
  }
  if (options.length < 2) return { ok: false, error: "A poll needs at least two options", values };
  return {
    ok: true,
    poll: {
      title: parsed.data.title,
      description: parsed.data.description.trim(),
      slug: parsed.data.slug,
      multi: parsed.data.multi === "1",
      closesAt: parsed.data.closesAt ? new Date(parsed.data.closesAt) : null,
      options,
    },
  };
}

const formError = (c: Context, values: PollFormValues, error: string) =>
  c.html(<PollForm values={values} error={error} />, 400);

pollsAdmin.get("/polls", (c) => {
  const pq = readPageQuery(c);
  const where = pq.q
    ? or(like(schema.polls.slug, likePattern(pq.q)), like(schema.polls.title, likePattern(pq.q)))
    : undefined;
  const total =
    db.select({ n: sql<number>`count(*)` }).from(schema.polls).where(where).get()?.n ?? 0;
  const polls = db
    .select()
    .from(schema.polls)
    .where(where)
    .orderBy(desc(schema.polls.createdAt))
    .limit(pq.limit)
    .offset(pq.offset)
    .all();

  const now = new Date();
  const ids = polls.map((p) => p.id);
  const voterCounts = ids.length
    ? db
        .select({
          pollId: schema.pollVotes.pollId,
          n: sql<number>`count(distinct ${schema.pollVotes.voterId})`,
        })
        .from(schema.pollVotes)
        .where(inArray(schema.pollVotes.pollId, ids))
        .groupBy(schema.pollVotes.pollId)
        .all()
    : [];
  const votersByPoll = new Map(voterCounts.map((v) => [v.pollId, v.n]));
  const stats = eventStatsForKind("poll", ids, now);

  const rows: PollRow[] = polls.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    voters: votersByPoll.get(p.id) ?? 0,
    closesAt: p.closesAt,
    createdAt: p.createdAt,
    views: stats.get(p.id)?.views ?? 0,
    spark: stats.get(p.id)?.spark ?? [],
  }));

  const meta = buildPageMeta("/admin/polls", pq, total);
  return c.html(<Polls rows={rows} now={now} meta={meta} />);
});

pollsAdmin.get("/new/poll", (c) =>
  c.html(
    <PollForm
      values={{ title: "", description: "", slug: "", multi: false, closesAt: null, options: [] }}
    />,
  ),
);

pollsAdmin.post("/new/poll", async (c) => {
  const result = parsePollForm(await c.req.parseBody());
  if (!result.ok) return formError(c, result.values, result.error);
  const { poll } = result;
  const slug = poll.slug || newSlug();
  if (slugTaken(slug)) return formError(c, poll, `/poll/${slug} is already taken`);

  savePoll({ ...poll, slug, description: poll.description || null });
  return c.redirect(`/poll/${slug}`);
});

pollsAdmin.get("/polls/:id/edit", (c) => {
  const poll = db
    .select()
    .from(schema.polls)
    .where(eq(schema.polls.id, c.req.param("id")))
    .get();
  if (!poll) return c.notFound();
  return c.html(
    <PollForm
      values={{
        id: poll.id,
        title: poll.title,
        description: poll.description ?? "",
        slug: poll.slug,
        multi: poll.multi,
        closesAt: poll.closesAt,
        options: loadOptions(poll.id).map((o) => ({ id: o.id, content: o.content })),
      }}
    />,
  );
});

pollsAdmin.post("/polls/:id", async (c) => {
  const id = c.req.param("id");
  const existing = db.select().from(schema.polls).where(eq(schema.polls.id, id)).get();
  if (!existing) return c.notFound();
  const result = parsePollForm(await c.req.parseBody());
  if (!result.ok) return formError(c, { ...result.values, id }, result.error);
  const { poll } = result;
  const slug = poll.slug || existing.slug;
  if (slugTaken(slug, id)) return formError(c, { ...poll, id }, `/poll/${slug} is already taken`);

  savePoll({ ...poll, slug, description: poll.description || null }, id);
  return c.redirect("/admin/polls");
});

pollsAdmin.post("/polls/:id/close", (c) => {
  const id = c.req.param("id");
  const poll = db.select().from(schema.polls).where(eq(schema.polls.id, id)).get();
  if (!poll) return c.notFound();
  const now = new Date();
  db.update(schema.polls)
    .set({ closesAt: isClosed(poll, now) ? null : now })
    .where(eq(schema.polls.id, id))
    .run();
  return c.redirect("/admin/polls");
});

pollsAdmin.get("/polls/:id/results", (c) => {
  const poll = db
    .select()
    .from(schema.polls)
    .where(eq(schema.polls.id, c.req.param("id")))
    .get();
  if (!poll) return c.notFound();
  const tally = loadTally(poll.id);
  return c.html(
    <PollResults
      id={poll.id}
      slug={poll.slug}
      title={poll.title}
      closesAt={poll.closesAt}
      now={new Date()}
      options={loadOptions(poll.id).map((o) => ({
        id: o.id,
        html: renderInline(o.content),
        count: tally.counts.get(o.id) ?? 0,
      }))}
      voters={loadVoterRows(poll.id)}
    />,
  );
});

/* Ranked, every-option image for announcing the winner — admin only, unlike og.png. */
pollsAdmin.get("/polls/:id/results.png", async (c) => {
  const poll = db
    .select()
    .from(schema.polls)
    .where(eq(schema.polls.id, c.req.param("id")))
    .get();
  if (!poll) return c.notFound();
  const now = new Date();
  const tally = loadTally(poll.id);
  const png = await renderPollResults({
    eyebrow: isClosed(poll, now) ? "Final results · ShareIt" : "Results so far · ShareIt",
    title: poll.title,
    options: loadOptions(poll.id).map((o) => ({
      label: plainText(o.content),
      count: tally.counts.get(o.id) ?? 0,
    })),
    voters: tally.voters,
    footer: cardFooter(poll, tally.voters, now),
  });
  return c.body(png, 200, {
    "Content-Type": "image/png",
    "Content-Disposition": `inline; filename="${poll.slug}-results.png"`,
    "Cache-Control": "no-store",
  });
});

const csvCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/* One row per voter, one 0/1 column per option — pivots cleanly in a spreadsheet. */
pollsAdmin.get("/polls/:id/results.csv", (c) => {
  const poll = db
    .select()
    .from(schema.polls)
    .where(eq(schema.polls.id, c.req.param("id")))
    .get();
  if (!poll) return c.notFound();
  const options = loadOptions(poll.id);
  const lines = [
    ["Name", "Voted at", ...options.map((o) => plainText(o.content))],
    ...loadVoterRows(poll.id).map((v) => [
      v.name,
      v.votedAt.toISOString(),
      ...options.map((o) => (v.optionIds.has(o.id) ? "1" : "0")),
    ]),
  ];
  const csv = `${lines.map((l) => l.map(csvCell).join(",")).join("\r\n")}\r\n`;
  return c.body(csv, 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${poll.slug}-results.csv"`,
  });
});

// ─── Public ─────────────────────────────────────────────────────────────────

export const pollPublic = new Hono();

const bySlug = (slug: string) =>
  db.select().from(schema.polls).where(eq(schema.polls.slug, slug)).get();

function cardFooter(poll: Poll, voters: number, now: Date) {
  return [
    `${voters} ${voters === 1 ? "person" : "people"} voted`,
    poll.multi ? "Pick any" : "Pick one",
    pollStatus(poll.closesAt, now),
  ].join(" · ");
}

pollPublic.get("/poll/:slug", async (c) => {
  const poll = bySlug(c.req.param("slug"));
  if (!poll) return c.notFound();
  const now = new Date();
  const options = loadOptions(poll.id);
  const tally = loadTally(poll.id);

  const voterId = getCookie(c, VOTER_COOKIE);
  const voter = voterId
    ? db.select().from(schema.voters).where(eq(schema.voters.id, voterId)).get()
    : undefined;
  const mine = new Set(
    voter
      ? db
          .select({ optionId: schema.pollVotes.optionId })
          .from(schema.pollVotes)
          .where(and(eq(schema.pollVotes.pollId, poll.id), eq(schema.pollVotes.voterId, voter.id)))
          .all()
          .map((v) => v.optionId)
      : [],
  );
  if (voter) writeVoterCookie(c, voter.id);

  track(c, "poll", poll.id, "view");
  const authed = await isAuthed(c);
  const url = fullUrl("poll", poll.slug);
  const description = poll.description
    ? plainText(poll.description)
    : options.map((o) => plainText(o.content)).join(" · ");

  return c.html(
    <PollView
      slug={poll.slug}
      title={poll.title}
      descriptionHtml={poll.description ? renderMarkdown(poll.description) : null}
      multi={poll.multi}
      closesAt={poll.closesAt}
      now={now}
      options={options.map((o) => ({
        id: o.id,
        html: renderInline(o.content),
        count: tally.counts.get(o.id) ?? 0,
        mine: mine.has(o.id),
      }))}
      voterCount={tally.voters}
      voterName={voter?.name ?? null}
      voted={c.req.query("voted") === "1"}
      admin={authed ? { id: poll.id } : null}
      og={{
        title: poll.title,
        description: description.slice(0, 300),
        url,
        // Version the image by vote count so a re-shared link isn't stuck on a stale cache.
        image: `${url}/og.png?v=${tally.voters}`,
        labels: [
          ["Votes", String(tally.voters)],
          [poll.multi ? "Pick any" : "Pick one", pollStatus(poll.closesAt, now)],
        ],
      }}
    />,
  );
});

pollPublic.post("/poll/:slug", async (c) => {
  const poll = bySlug(c.req.param("slug"));
  if (!poll) return c.notFound();
  if (isClosed(poll, new Date())) return c.text("This poll is closed", 403);

  const form = await c.req.parseBody({ all: true });
  const name = typeof form.name === "string" ? form.name.trim().slice(0, 60) : "";
  if (!name) return c.text("Name is required", 400);

  const picked = [form.option ?? []].flat().filter((v): v is string => typeof v === "string");
  const valid = new Set(loadOptions(poll.id).map((o) => o.id));
  const optionIds = [...new Set(picked)].filter((id) => valid.has(id));
  if (!poll.multi && optionIds.length > 1) return c.text("Pick only one option", 400);

  const cookieId = getCookie(c, VOTER_COOKIE);
  const known = cookieId
    ? db.select().from(schema.voters).where(eq(schema.voters.id, cookieId)).get()
    : undefined;
  const voterId = known?.id ?? newId();

  db.transaction((tx) => {
    if (known) {
      tx.update(schema.voters).set({ name }).where(eq(schema.voters.id, voterId)).run();
    } else {
      tx.insert(schema.voters).values({ id: voterId, name }).run();
    }
    // A vote replaces the voter's previous picks; submitting none withdraws the vote.
    tx.delete(schema.pollVotes)
      .where(and(eq(schema.pollVotes.pollId, poll.id), eq(schema.pollVotes.voterId, voterId)))
      .run();
    for (const optionId of optionIds) {
      tx.insert(schema.pollVotes).values({ pollId: poll.id, optionId, voterId }).run();
    }
  });

  writeVoterCookie(c, voterId);
  track(c, "poll", poll.id, "vote");
  return c.redirect(`/poll/${poll.slug}?voted=1`, 303);
});

pollPublic.get("/poll/:slug/og.png", async (c) => {
  const poll = bySlug(c.req.param("slug"));
  if (!poll) return c.notFound();
  const tally = loadTally(poll.id);
  const png = await renderPollCard({
    title: poll.title,
    options: loadOptions(poll.id).map((o) => ({
      label: plainText(o.content),
      count: tally.counts.get(o.id) ?? 0,
    })),
    footer: cardFooter(poll, tally.voters, new Date()),
  });
  return c.body(png, 200, {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=300",
  });
});

// ─── API (X-Share-Key) ──────────────────────────────────────────────────────
// Contract documented for agents in src/assets/llms.txt — keep the two in sync.

export const pollApi = new Hono();
pollApi.use("*", requireShareKey);

const apiOption = z
  .union([z.string(), z.object({ id: z.string().optional(), content: z.string() })])
  .transform((o) =>
    typeof o === "string" ? { content: o.trim() } : { id: o.id, content: o.content.trim() },
  )
  .refine((o) => o.content.length > 0, "Option content can't be empty");

const apiFields = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10_000).nullable(),
  slug: z.string().regex(POLL_SLUG, "Slug can only use letters, numbers, - and _"),
  multi: z.boolean(),
  closesAt: z.iso.datetime({ offset: true }).nullable(),
  options: z.array(apiOption).min(2, "A poll needs at least two options").max(50),
});
const apiCreate = apiFields.partial({ description: true, slug: true, multi: true, closesAt: true });
const apiPatch = apiFields.partial();

async function readJson<T extends z.ZodType>(c: Context, schema: T) {
  const body: unknown = await c.req.json().catch(() => undefined);
  if (body === undefined) return { error: "Body must be JSON" } as const;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `${issue?.path.join(".") || "body"}: ${issue?.message}` } as const;
  }
  return { data: parsed.data as z.output<T> } as const;
}

const toDate = (iso: string | null | undefined) => (iso ? new Date(iso) : null);
const cleanDescription = (d: string | null | undefined) => d?.trim() || null;

function pollJson(poll: Poll) {
  const tally = loadTally(poll.id);
  return {
    id: poll.id,
    slug: poll.slug,
    title: poll.title,
    description: poll.description,
    multi: poll.multi,
    closesAt: poll.closesAt?.toISOString() ?? null,
    closed: isClosed(poll, new Date()),
    url: fullUrl("poll", poll.slug),
    apiUrl: `${siteUrl}/api/polls/${poll.slug}`,
    voterCount: tally.voters,
    options: loadOptions(poll.id).map((o) => ({
      id: o.id,
      content: o.content,
      votes: tally.counts.get(o.id) ?? 0,
    })),
    voters: loadVoterRows(poll.id).map((v) => ({
      name: v.name,
      optionIds: [...v.optionIds],
      votedAt: v.votedAt.toISOString(),
    })),
  };
}

pollApi.get("/polls", (c) => {
  const now = new Date();
  const polls = db.select().from(schema.polls).orderBy(desc(schema.polls.createdAt)).all();
  return c.json(
    polls.map((p) => ({
      slug: p.slug,
      title: p.title,
      closed: isClosed(p, now),
      url: fullUrl("poll", p.slug),
      apiUrl: `${siteUrl}/api/polls/${p.slug}`,
      createdAt: p.createdAt.toISOString(),
    })),
  );
});

pollApi.post("/polls", async (c) => {
  const body = await readJson(c, apiCreate);
  if ("error" in body) return c.json({ error: body.error }, 400);
  const d = body.data;
  const slug = d.slug ?? newSlug();
  if (slugTaken(slug)) return c.json({ error: `Slug "${slug}" is already taken` }, 409);

  const id = savePoll({
    title: d.title,
    description: cleanDescription(d.description),
    slug,
    multi: d.multi ?? false,
    closesAt: toDate(d.closesAt),
    options: d.options,
  });
  const poll = db.select().from(schema.polls).where(eq(schema.polls.id, id)).get();
  return poll ? c.json(pollJson(poll), 201) : c.json({ error: "Poll vanished" }, 500);
});

pollApi.get("/polls/:slug", (c) => {
  const poll = bySlug(c.req.param("slug"));
  return poll ? c.json(pollJson(poll)) : c.json({ error: "Poll not found" }, 404);
});

pollApi.patch("/polls/:slug", async (c) => {
  const poll = bySlug(c.req.param("slug"));
  if (!poll) return c.json({ error: "Poll not found" }, 404);
  const body = await readJson(c, apiPatch);
  if ("error" in body) return c.json({ error: body.error }, 400);
  const d = body.data;
  const slug = d.slug ?? poll.slug;
  if (slugTaken(slug, poll.id)) return c.json({ error: `Slug "${slug}" is already taken` }, 409);

  savePoll(
    {
      title: d.title ?? poll.title,
      description: d.description === undefined ? poll.description : cleanDescription(d.description),
      slug,
      multi: d.multi ?? poll.multi,
      closesAt: d.closesAt === undefined ? poll.closesAt : toDate(d.closesAt),
      options: d.options ?? loadOptions(poll.id).map((o) => ({ id: o.id, content: o.content })),
    },
    poll.id,
  );
  const updated = bySlug(slug);
  return updated ? c.json(pollJson(updated)) : c.json({ error: "Poll vanished" }, 500);
});
