import { useMemo, useRef, useState } from "react";
import { Heart, MessageCircle, Users, UserRound, SlidersHorizontal, X, MapPin, Sparkles, Search, Plus, Bookmark, Send, ChevronRight, Bell, Menu } from "lucide-react";

type Tab = "match" | "chats" | "community" | "profile";
const people = [
  { id: 1, name: "Claudia", age: 23, city: "Barcelona", initials: "C", color: "rose", bio: "Siempre digo que sí a un brunch, una escapada o un café que se alarga.", tags: ["Brunch", "Viajes", "Moda"], distance: "A 3 km" },
  { id: 2, name: "Marta", age: 24, city: "Barcelona", initials: "M", color: "lilac", bio: "Busco amigas con las que compartir planes espontáneos y muchas conversaciones.", tags: ["Cafés", "Conciertos", "Lifestyle"], distance: "A 5 km" },
  { id: 3, name: "Núria", age: 22, city: "Sant Just Desvern", initials: "N", color: "peach", bio: "Fan de los planes tranquilos, descubrir sitios nuevos y viajar siempre que puedo.", tags: ["Travel", "Foodie", "Paseos"], distance: "A 7 km" }
];
const categories = ["UGC & Creator Life", "Salud mental", "Redes sociales", "Belleza & bienestar", "Ciclo menstrual & ovulación", "Sexualidad & anticonceptivos", "Lifestyle & día a día", "Viajes & nuevas amistades"];
const initialPosts = [
  { id: 1, category: "Viajes & nuevas amistades", title: "¿Alguien más acaba de mudarse a Barcelona?", body: "Me encantaría conocer chicas para tomar algo y descubrir rincones nuevos de la ciudad 💗", author: "Andrea", initials: "A", time: "Hace 12 min", likes: 18, comments: 6 },
  { id: 2, category: "Lifestyle & día a día", title: "Planes bonitos para un sábado", body: "Busco ideas de planes diferentes para salir de la rutina. ¿Qué soléis hacer?", author: "Paula", initials: "P", time: "Hace 38 min", likes: 12, comments: 9 },
  { id: 3, category: "Viajes & nuevas amistades", title: "Escapada de chicas este otoño 🍂", body: "¿Alguna recomendación de destino para un finde de amigas?", author: "Laia", initials: "L", time: "Hace 1 h", likes: 27, comments: 11 }
];
function Avatar({ initials, tone = "rose", small = false }: { initials: string; tone?: string; small?: boolean }) {
  return <div className={`avatar ${tone} ${small ? "small" : ""}`}>{initials}</div>;
}
export default function App() {
  const [tab, setTab] = useState<Tab>("match");
  const [personIndex, setPersonIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const dragStartX = useRef(0);
  const activePointer = useRef<number | null>(null);
  const [liked, setLiked] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [posts, setPosts] = useState(initialPosts);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const current = people[personIndex % people.length];
  const visiblePosts = useMemo(() => posts.filter(p => (activeCategory === "Todas" || p.category === activeCategory) && (p.title + p.body).toLowerCase().includes(query.toLowerCase())), [posts, activeCategory, query]);
  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2400); };
  const nextPerson = (like: boolean) => {
    if (like) { setLiked(old => [...old, current.id]); flash("¡Like enviado! Si es mutuo, tendréis un match 💗"); }
    else flash("¡Seguimos buscando a tus girls!");
    setPersonIndex(i => i + 1);
  };
  const handleCardPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    activePointer.current = event.pointerId;
    dragStartX.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleCardPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!isDragging || activePointer.current !== event.pointerId) return;
    setDragX(event.clientX - dragStartX.current);
  };
  const finishCardSwipe = (direction: "left" | "right") => {
    setIsDragging(false);
    setSwipeDirection(direction);
    window.setTimeout(() => {
      setDragX(0);
      setSwipeDirection(null);
      activePointer.current = null;
      nextPerson(direction === "right");
    }, 220);
  };
  const handleCardPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (activePointer.current !== event.pointerId) return;
    const distance = event.clientX - dragStartX.current;
    if (Math.abs(distance) > 105) finishCardSwipe(distance > 0 ? "right" : "left");
    else { setIsDragging(false); setDragX(0); activePointer.current = null; }
  };
  const handleCardPointerCancel = () => { setIsDragging(false); setDragX(0); activePointer.current = null; };
  const createPost = () => {
    if (!postTitle.trim() || !postBody.trim()) return;
    setPosts(old => [{ id: Date.now(), category: activeCategory === "Todas" ? categories[0] : activeCategory, title: postTitle, body: postBody, author: "Tú", initials: "T", time: "Ahora", likes: 0, comments: 0 }, ...old]);
    setPostTitle(""); setPostBody(""); setShowComposer(false); flash("Tu publicación se ha añadido al foro.");
  };
  const nav = [
    { id: "match" as Tab, label: "Match", icon: Heart },
    { id: "chats" as Tab, label: "Chats", icon: MessageCircle },
    { id: "community" as Tab, label: "Community", icon: Users },
    { id: "profile" as Tab, label: "Perfil", icon: UserRound }
  ];
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="bow">୨୧</span><span>girlys<span className="brand-light"> match</span></span></div><div className="top-actions"><span className="desktop-note">Friendship starts here</span><button className="icon-button" aria-label="Notificaciones" onClick={() => flash("No tienes notificaciones nuevas.")}><Bell size={19}/></button><Avatar initials="R" small/></div></header>
    <main className="main">
      {tab === "match" && <section className="match-view">
        <div className="section-heading"><div><p className="eyebrow">YOUR NEXT GIRL FRIEND</p><h1>Find your girls<span className="pink-dot">.</span></h1><p className="muted">Personas con las que conectar, compartir y crear recuerdos.</p></div><button className="filter-button" onClick={() => flash("Los filtros estarán disponibles muy pronto.")}><SlidersHorizontal size={17}/> Filtros</button></div>
        <div className={`match-card ${isDragging ? "is-dragging" : ""} ${swipeDirection ? `swipe-${swipeDirection}` : ""}`} style={{ transform: swipeDirection ? undefined : `translateX(${dragX}px) rotate(${dragX * 0.045}deg)`, transition: isDragging ? "none" : undefined }} onPointerDown={handleCardPointerDown} onPointerMove={handleCardPointerMove} onPointerUp={handleCardPointerUp} onPointerCancel={handleCardPointerCancel}><div className={`profile-placeholder ${current.color}`}><div className="placeholder-top"><span className="distance"><MapPin size={13}/>{current.distance}</span><span className="verified"><Sparkles size={13}/> Nuevas conexiones</span></div><div className="big-initials">{current.initials}</div><div className="photo-hint">Aquí aparecerá la foto de perfil de la usuaria</div><div className="profile-gradient"><h2>{current.name}, {current.age}</h2><p><MapPin size={15}/>{current.city}</p></div></div>
          <div className="profile-info"><p>{current.bio}</p><div className="tag-row">{current.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div></div>
          <div className="swipe-actions"><button className="round-action pass" aria-label="Pasar" onClick={() => nextPerson(false)}><X size={24}/></button><span className="action-caption">Pasar</span><button className="round-action like" aria-label="Me gusta" onClick={() => nextPerson(true)}><Heart size={25} fill="currentColor"/></button><span className="action-caption">Me gusta</span></div>
        </div><p className="center-note">Desliza a la derecha para dar like · a la izquierda para pasar ✨</p>
      </section>}
      {tab === "chats" && <section className="content-view"><p className="eyebrow">YOUR CONNECTIONS</p><h1>Tus chats<span className="pink-dot">.</span></h1><p className="muted">Las conversaciones empiezan cuando el match es mutuo.</p><div className="empty-state"><div className="empty-icon"><MessageCircle size={27}/></div><h3>Tu próxima conversación empieza aquí</h3><p>Cuando conectes con otra girl, aparecerá aquí vuestro chat privado.</p><button className="primary-button" onClick={() => setTab("match")}>Descubrir girls</button></div></section>}
      {tab === "community" && <section className="content-view community-view"><div className="section-heading"><div><p className="eyebrow">THE GIRLYS COMMUNITY</p><h1>Hablemos de todo<span className="pink-dot">.</span></h1><p className="muted">Un espacio para compartir, preguntar y sentirte acompañada.</p></div><button className="primary-button compact" onClick={() => setShowComposer(true)}><Plus size={17}/> Publicar</button></div>
        <div className="community-tools"><div className="search-box"><Search size={17}/><input placeholder="Buscar conversaciones..." value={query} onChange={e => setQuery(e.target.value)}/></div></div>
        <div className="community-blocks"><button className={activeCategory === "Todas" ? "community-block all-block active" : "community-block all-block"} onClick={() => setActiveCategory("Todas")}><span className="block-symbol">✦</span><strong>Todos los temas</strong><small>Explora toda la comunidad</small></button>{categories.map((c, i) => <button key={c} className={activeCategory === c ? "community-block active" : "community-block"} onClick={() => setActiveCategory(c)}><span className="block-symbol">{["✧","♡","◎","✿","☾","✦","☕","↗"][i]}</span><strong>{c}</strong><small>Conversaciones y experiencias</small></button>)}</div>
        <div className="feed">{visiblePosts.map(post => <article className="post-card" key={post.id}><div className="post-meta"><Avatar initials={post.initials} small/><div><strong>{post.author}</strong><span>{post.time}</span></div><span className="post-category">{post.category}</span></div><h3>{post.title}</h3><p>{post.body}</p><div className="post-actions"><button onClick={() => setPosts(old => old.map(p => p.id === post.id ? {...p, likes: p.likes + 1} : p))}><Heart size={16}/> {post.likes}</button><button onClick={() => flash("Los comentarios estarán disponibles en la siguiente versión.")}><MessageCircle size={16}/> {post.comments} comentarios</button><button className="save-action" onClick={() => flash("Publicación guardada.")}><Bookmark size={16}/></button></div></article>)}</div>
      </section>}
      {tab === "profile" && <section className="content-view"><p className="eyebrow">THIS IS YOU</p><h1>Tu espacio<span className="pink-dot">.</span></h1><div className="own-profile"><Avatar initials="R" tone="lilac"/><div><h3>Tu perfil</h3><p className="muted">Completa tu perfil para que otras girls puedan conocerte.</p></div></div><div className="profile-menu"><button onClick={() => flash("El editor de perfil estará disponible muy pronto.")}>Editar mi perfil <ChevronRight size={18}/></button><button onClick={() => flash("Tus publicaciones guardadas aparecerán aquí.")}>Guardados <ChevronRight size={18}/></button><button onClick={() => flash("La configuración estará disponible muy pronto.")}>Ajustes y privacidad <ChevronRight size={18}/></button><button onClick={() => flash("Centro de ayuda próximamente.")}>Ayuda y seguridad <ChevronRight size={18}/></button></div></section>}
    </main>
    <nav className="bottom-nav">{nav.map(({id,label,icon:Icon}) => <button key={id} className={tab === id ? "nav-item active" : "nav-item"} onClick={() => setTab(id)}><Icon size={20} strokeWidth={tab === id ? 2.4 : 1.8}/><span>{label}</span></button>)}</nav>
    {showComposer && <div className="modal-backdrop" onClick={() => setShowComposer(false)}><div className="composer" onClick={e => e.stopPropagation()}><div className="composer-head"><div><p className="eyebrow">COMMUNITY</p><h2>Nueva publicación</h2></div><button className="icon-button" onClick={() => setShowComposer(false)}><X/></button></div><label>Categoría<select value={activeCategory === "Todas" ? categories[0] : activeCategory} onChange={e => setActiveCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Título<input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="¿Qué quieres compartir?"/></label><label>Tu publicación<textarea value={postBody} onChange={e => setPostBody(e.target.value)} placeholder="Escribe aquí..." rows={4}/></label><button className="primary-button full" onClick={createPost} disabled={!postTitle.trim() || !postBody.trim()}><Send size={16}/> Publicar en Community</button></div></div>}
    {notice && <div className="toast">{notice}</div>}
    <footer className="footer-note">GIRLYS MATCH <span>·</span> FIND YOUR GIRLS</footer>
  </div>;
}