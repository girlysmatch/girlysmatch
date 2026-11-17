interface D1PreparedStatement { bind(...values: unknown[]): D1PreparedStatement; first<T = Record<string, unknown>>(): Promise<T | null>; all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>; run(): Promise<{ meta?: { changes?: number } }> }
interface D1Database { prepare(query: string): D1PreparedStatement }
interface Env { DB: D1Database }
type Ctx = { request: Request; env: Env; params: { postId: string } };

async function authenticatedUser(request: Request, env: Env): Promise<string | null> {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\\s*)gm_session=([^;]+)/);
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const tokenHash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
  const row = await env.DB.prepare("SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > datetime('now')").bind(tokenHash).first<{ user_id: string }>();
  return row?.user_id ?? null;
}

export const onRequestGet = async ({ env, params }: Ctx): Promise<Response> => {
  const postId = params.postId;
  const post = await env.DB.prepare("SELECT id FROM forum_posts WHERE id = ? AND status = 'published'").bind(postId).first();
  if (!post) return Response.json({ error: "La publicación no existe." }, { status: 404 });
  const result = await env.DB.prepare("SELECT c.id, c.body, c.created_at, COALESCE(p.display_name, 'Girl') AS author FROM forum_comments c LEFT JOIN profiles p ON p.user_id = c.author_id WHERE c.post_id = ? AND c.status = 'published' ORDER BY c.created_at ASC").bind(postId).all();
  return Response.json({ comments: result.results ?? [] });
};

export const onRequestPost = async ({ request, env, params }: Ctx): Promise<Response> => {
  const userId = await authenticatedUser(request, env);
  if (!userId) return Response.json({ error: "Inicia sesión para comentar." }, { status: 401 });
  const postId = params.postId;
  const post = await env.DB.prepare("SELECT id FROM forum_posts WHERE id = ? AND status = 'published'").bind(postId).first();
  if (!post) return Response.json({ error: "La publicación no existe." }, { status: 404 });
  let payload: { body?: unknown };
  try { payload = await request.json() as { body?: unknown }; } catch { return Response.json({ error: "Solicitud no válida." }, { status: 400 }); }
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!body || body.length > 5000) return Response.json({ error: "El comentario debe tener entre 1 y 5.000 caracteres." }, { status: 400 });
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO forum_comments (id, post_id, author_id, body) VALUES (?, ?, ?, ?)").bind(id, postId, userId, body).run();
  const comment = await env.DB.prepare("SELECT c.id, c.body, c.created_at, COALESCE(p.display_name, 'Girl') AS author FROM forum_comments c LEFT JOIN profiles p ON p.user_id = c.author_id WHERE c.id = ?").bind(id).first();
  return Response.json({ comment }, { status: 201 });
};
