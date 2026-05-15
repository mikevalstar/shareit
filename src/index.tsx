import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { createSession, destroySession, isAuthed, verifyPassword } from "./lib/auth";
import { admin } from "./routes/admin";
import { filePublic, filesAdmin } from "./routes/files";
import { shortlinkPublic, shortlinksAdmin } from "./routes/shortlinks";
import { snippetPublic, snippetsAdmin } from "./routes/snippets";
import { Home, Login } from "./views/pages";

const app = new Hono();

app.use(
  "/static/*",
  serveStatic({ root: "./public", rewriteRequestPath: (p) => p.replace(/^\/static/, "") }),
);

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
