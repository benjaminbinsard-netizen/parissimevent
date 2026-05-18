"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  type: string;
  message: string;
  status: "new" | "read" | "archived";
  createdAt: string;
};

type Counts = { new: number; read: number; archived: number; total: number };
type Filter = "all" | "new" | "read" | "archived";

const POLL_MS = 4000;

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function Dashboard() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Counts>({
    new: 0,
    read: 0,
    archived: 0,
    total: 0,
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [live, setLive] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState<Set<string>>(new Set());

  const knownIds = useRef<Set<string> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      if (!data.ok) return;

      const incoming: Lead[] = data.leads;

      if (knownIds.current === null) {
        // Premier chargement : on mémorise sans notifier.
        knownIds.current = new Set(incoming.map((l) => l.id));
      } else {
        const fresh = incoming.filter((l) => !knownIds.current!.has(l.id));
        if (fresh.length > 0) {
          fresh.forEach((l) => knownIds.current!.add(l.id));
          setFlash((prev) => {
            const n = new Set(prev);
            fresh.forEach((l) => n.add(l.id));
            return n;
          });
          setTimeout(() => {
            setFlash((prev) => {
              const n = new Set(prev);
              fresh.forEach((l) => n.delete(l.id));
              return n;
            });
          }, 1800);
          showToast(
            fresh.length === 1
              ? `Nouvelle demande · ${fresh[0].firstName} ${fresh[0].lastName}`
              : `${fresh.length} nouvelles demandes`,
          );
        }
      }

      setLeads(incoming);
      setCounts(data.counts);
      setLoaded(true);
    } catch {
      /* réseau momentané — on réessaie au prochain tick */
    }
  }, [router, showToast]);

  // Chargement initial + polling temps réel (en pause si l'onglet est caché).
  useEffect(() => {
    load();
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (!document.hidden) load();
      }, POLL_MS);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVis = () => {
      setLive(!document.hidden);
      if (document.hidden) stop();
      else {
        load();
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  async function setStatus(id: string, status: Lead["status"]) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l)),
    );
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer définitivement cette demande ?")) return;
    setLeads((prev) => prev.filter((l) => l.id !== id));
    knownIds.current?.delete(id);
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  const q = query.trim().toLowerCase();
  const visible = leads.filter((l) => {
    if (filter !== "all" && l.status !== filter) return false;
    if (!q) return true;
    return (
      `${l.firstName} ${l.lastName} ${l.email} ${l.type} ${l.message}`
        .toLowerCase()
        .includes(q)
    );
  });

  const tabs: { key: Filter; label: string; badge?: number }[] = [
    { key: "all", label: "Toutes", badge: counts.total },
    { key: "new", label: "Nouvelles", badge: counts.new },
    { key: "read", label: "Traitées", badge: counts.read },
    { key: "archived", label: "Archivées", badge: counts.archived },
  ];

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          Maison <i>Parissim</i>.<small>Console des demandes</small>
        </div>
        <div className="topbar-right">
          <span className={`live${live ? "" : " paused"}`}>
            <span className="pulse" />
            {live ? "Temps réel" : "En pause"}
          </span>
          <button className="linkbtn" onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </header>

      <main className="main">
        <div className="stats">
          <div className="stat">
            <div className="n">{counts.total}</div>
            <div className="l">Demandes totales</div>
          </div>
          <div className="stat">
            <div className="n">{counts.new}</div>
            <div className="l">À traiter</div>
          </div>
          <div className="stat">
            <div className="n">{counts.read}</div>
            <div className="l">Traitées</div>
          </div>
          <div className="stat">
            <div className="n">{counts.archived}</div>
            <div className="l">Archivées</div>
          </div>
        </div>

        <div className="toolbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`tab${filter === t.key ? " active" : ""}`}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
              {typeof t.badge === "number" && (
                <span className="badge">{t.badge}</span>
              )}
            </button>
          ))}
          <input
            className="input search"
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="list">
          {!loaded ? (
            <div className="empty">Chargement…</div>
          ) : visible.length === 0 ? (
            <div className="empty">
              <h3>Aucune demande</h3>
              <p>
                {filter === "all"
                  ? "Les nouvelles demandes du formulaire apparaîtront ici en temps réel."
                  : "Rien dans cette catégorie."}
              </p>
            </div>
          ) : (
            visible.map((l) => (
              <article
                key={l.id}
                className={`lead${l.status === "new" ? " new" : ""}${
                  flash.has(l.id) ? " flash" : ""
                }`}
              >
                <div className="lead-head">
                  <div>
                    <div className="lead-name">
                      {l.firstName} {l.lastName}
                    </div>
                    <span className="lead-tag">{l.type}</span>
                  </div>
                  <div className="lead-date">{timeAgo(l.createdAt)}</div>
                </div>

                <div className="lead-contact">
                  <a href={`mailto:${l.email}`}>✉ {l.email}</a>
                  {l.phone && <a href={`tel:${l.phone}`}>☎ {l.phone}</a>}
                </div>

                <div className="lead-msg">{l.message}</div>

                <div className="lead-actions">
                  {l.status !== "read" && (
                    <button
                      className="mini"
                      onClick={() => setStatus(l.id, "read")}
                    >
                      Marquer traitée
                    </button>
                  )}
                  {l.status === "read" && (
                    <button
                      className="mini"
                      onClick={() => setStatus(l.id, "new")}
                    >
                      Remettre à traiter
                    </button>
                  )}
                  {l.status !== "archived" ? (
                    <button
                      className="mini"
                      onClick={() => setStatus(l.id, "archived")}
                    >
                      Archiver
                    </button>
                  ) : (
                    <button
                      className="mini"
                      onClick={() => setStatus(l.id, "new")}
                    >
                      Désarchiver
                    </button>
                  )}
                  <button
                    className="mini danger"
                    onClick={() => remove(l.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
