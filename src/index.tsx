import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { isAuthed, verifyPassword, createSession, destroySession } from "./lib/auth";
import { Home, Login } from "./views/pages";
import { admin } from "./routes/admin";
import { shortlinksAdmin, shortlinkPublic } from "./routes/shortlinks";
import { filesAdmin, filePublic } from "./routes/files";
import { snippetsAdmin, snippetPublic } from "./routes/snippets";

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./public", rewriteRequestPath: (p) => p.replace(/^\/static/, "") }));

app.get("/", async (c) => c.html(<Home authed={await isAuthed(c)} />));

app.get("/login", (c) => c.html(<Login />));
app.post("/login", async (c) => {
  const form = await c.req.parseBody();
  const password = typeof form["password"] === "string" ? form["password"] : "";
  if (!(await verifyPassword(password))) return c.html(<Login error="Invalid password" />, 401);
  await createSession(c);
  return c.redirect("/admin");
});
app.post("/logout", (c) => {
  destroySession(c);
  return c.redirect("/");
});

app.route("/admin", admin);
app.route("/admin", shortlinksAdmin);
app.route("/admin", filesAdmin);
app.route("/admin", snippetsAdmin);

app.route("/", filePublic);
app.route("/", snippetPublic);
app.route("/", shortlinkPublic); // last: catches /:slug

app.notFound((c) => c.text("Not found", 404));

const port = Number(process.env.PORT ?? 3000);
console.log(`shareit listening on http://localhost:${port}`);

export default { port, fetch: app.fetch };
