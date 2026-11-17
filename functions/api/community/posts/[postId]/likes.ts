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

export const onRequestPost = async ({ request, env, params }: Ctx): Promise<Response> => {
  const userId = await authenticatedUser(request, env);
  if (!userId) return Response.json({ error: "Inicia sesión para dar like." }, { status: 401 });
  const postId = params.postId;
  if (!postId || postId.length > 100) return Response.json({ error: "Publicación no válida." }, { status: 400 });
  const post = await env.DB.prepare("SELECT id FROM forum_posts WHERE id = ? AND status = 'published'").bind(postId).first();
  if (!post) return Response.json({ error: "La publicación no existe." }, { status: 404 });
  const result = await env.DB.prepare("INSERT OR IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)").bind(postId, userId).run();
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?").bind(postId).first<{ count: number }>();
  return Response.json({ liked: true, alreadyLiked: (result.meta?.changes ?? 0) === 0, likes: count?.count ?? 0 });
};
