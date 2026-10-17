"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { ChatMsg, SharedEvent } from "@/lib/game/state";
import { normaliseStats } from "@/lib/game/state";
import type { Equipped, Look, Pronouns, Slot, Stats, Sticker } from "@/lib/game/types";

export interface RosterEntry {
  id: string;
  name: string;
  title: string;
  pronouns: Pronouns;
  look: Look;
  babyAesthetic: boolean;
  claimed: boolean;
  equipment: Equipped;
  stats: (Stats & { level: number; updated_at: string }) | null;
  status: { location_id: string | null; activity_id: string | null; activity_at: string | null; last_seen_at: string } | null;
}

export interface Reaction {
  key: string;
  from: string;
  sticker: Sticker;
}

export interface ActivityInvite {
  key: string;
  from: string;
  locationId: string;
  label: string;
}

type CharRow = {
  id: string; name: string; title: string; pronoun_subject: string; pronoun_object: string; pronoun_possessive: string;
  pronoun_plural: boolean; baby_aesthetic: boolean; look: Look; owner_user_id: string | null;
};

const toEntry = (c: CharRow, prev?: RosterEntry): RosterEntry => ({
  id: c.id,
  name: c.name,
  title: c.title,
  pronouns: { subject: c.pronoun_subject, object: c.pronoun_object, possessive: c.pronoun_possessive, plural: c.pronoun_plural },
  look: c.look,
  babyAesthetic: c.baby_aesthetic,
  claimed: c.owner_user_id !== null,
  equipment: prev?.equipment ?? {},
  stats: prev?.stats ?? null,
  status: prev?.status ?? null,
});

// Live view of the coven: roster, presence, chat, shared events and ephemeral broadcasts.
export function useCoven(covenId: string, me: string, handlers: { onInvite: (i: ActivityInvite) => void; onEventChange: (e: SharedEvent[]) => void }) {
  const supabase = supabaseBrowser();
  const [roster, setRoster] = useState<Record<string, RosterEntry>>({});
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [events, setEvents] = useState<SharedEvent[]>([]);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceRef = useRef<{ character_id: string; location_id: string | null }>({ character_id: me, location_id: null });
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const loadEvents = useCallback(async () => {
    const { data } = await supabase
      .from("shared_events")
      .select("*, shared_event_participants(character_id)")
      .eq("coven_id", covenId)
      .in("status", ["gathering", "complete"])
      .order("created_at", { ascending: false })
      .limit(6);
    const list: SharedEvent[] = (data ?? []).map((e: any) => ({
      ...e,
      participants: (e.shared_event_participants ?? []).map((p: any) => p.character_id),
    }));
    setEvents(list);
    handlersRef.current.onEventChange(list);
  }, [supabase, covenId]);

  const loadAll = useCallback(async () => {
    const [chars, stats, equip, status, msgs] = await Promise.all([
      supabase.from("characters").select("id,name,title,pronoun_subject,pronoun_object,pronoun_possessive,pronoun_plural,baby_aesthetic,look,owner_user_id").eq("coven_id", covenId),
      supabase.from("character_stats").select("character_id,nourishment,energy,joy,magic,social,level,updated_at"),
      supabase.from("equipment").select("character_id,slot,item_id"),
      supabase.from("character_status").select("*"),
      supabase.from("chat_messages").select("id,character_id,kind,body,created_at").eq("coven_id", covenId).order("created_at", { ascending: false }).limit(80),
    ]);
    const next: Record<string, RosterEntry> = {};
    for (const c of (chars.data ?? []) as CharRow[]) next[c.id] = toEntry(c);
    for (const s of stats.data ?? []) {
      if (next[s.character_id]) next[s.character_id].stats = { ...normaliseStats(s), level: s.level, updated_at: s.updated_at };
    }
    for (const e of equip.data ?? []) {
      if (next[e.character_id]) next[e.character_id].equipment[e.slot as Slot] = e.item_id;
    }
    for (const st of status.data ?? []) {
      if (next[st.character_id]) next[st.character_id].status = st;
    }
    setRoster(next);
    setChat(((msgs.data ?? []) as ChatMsg[]).reverse());
    await loadEvents();
  }, [supabase, covenId, loadEvents]);

  useEffect(() => {
    let cancelled = false;
    // Initial fetch from Supabase (an external system); state is set after the network round trip.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
    const ch = supabase.channel(`coven:${covenId}`, { config: { private: true, presence: { key: me } } });
    channelRef.current = ch;

    const patch = (id: string, fn: (r: RosterEntry) => RosterEntry) =>
      setRoster((cur) => (cur[id] ? { ...cur, [id]: fn(cur[id]) } : cur));

    ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `coven_id=eq.${covenId}` }, (p) => {
      const m = p.new as ChatMsg;
      if (!m.deleted_at) setChat((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur.slice(-120), m]));
    })
      .on("postgres_changes", { event: "*", schema: "public", table: "character_status" }, (p) => {
        const st = p.new as any;
        if (st?.character_id) patch(st.character_id, (r) => ({ ...r, status: st }));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "character_stats" }, (p) => {
        const s = p.new as any;
        patch(s.character_id, (r) => ({ ...r, stats: { ...normaliseStats(s), level: s.level, updated_at: s.updated_at } }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "equipment" }, (p) => {
        if (p.eventType === "DELETE") {
          const o = p.old as any;
          patch(o.character_id, (r) => {
            const eq = { ...r.equipment };
            delete eq[o.slot as Slot];
            return { ...r, equipment: eq };
          });
        } else {
          const n = p.new as any;
          patch(n.character_id, (r) => ({ ...r, equipment: { ...r.equipment, [n.slot]: n.item_id } }));
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "characters" }, (p) => {
        const c = p.new as CharRow;
        setRoster((cur) => ({ ...cur, [c.id]: toEntry(c, cur[c.id]) }));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "shared_events" }, () => loadEvents())
      .on("postgres_changes", { event: "*", schema: "public", table: "shared_event_participants" }, () => loadEvents())
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState<{ character_id: string }>();
        setOnline(new Set(Object.values(state).flat().map((x) => x.character_id)));
      })
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const r = payload as Reaction;
        setReactions((cur) => [...cur, r]);
        setTimeout(() => setReactions((cur) => cur.filter((x) => x.key !== r.key)), 2600);
      })
      .on("broadcast", { event: "invite" }, ({ payload }) => {
        if (payload.to === me) handlersRef.current.onInvite(payload as ActivityInvite);
      })
      .on("broadcast", { event: "chat_deleted" }, ({ payload }) => {
        setChat((cur) => cur.filter((m) => m.id !== payload.id));
      })
      .subscribe(async (status) => {
        if (cancelled) return;
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") await ch.track(presenceRef.current);
      });

    // Re-sync after the tab sleeps (phones suspend websockets).
    const onVisible = () => {
      if (document.visibilityState === "visible") loadAll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(ch);
    };
  }, [supabase, covenId, me, loadAll, loadEvents]);

  const setPresenceLocation = useCallback((location_id: string | null) => {
    presenceRef.current = { character_id: me, location_id };
    channelRef.current?.track(presenceRef.current).catch(() => {});
  }, [me]);

  const react = useCallback((sticker: Sticker) => {
    const r: Reaction = { key: crypto.randomUUID(), from: me, sticker };
    setReactions((cur) => [...cur, r]);
    setTimeout(() => setReactions((cur) => cur.filter((x) => x.key !== r.key)), 2600);
    channelRef.current?.send({ type: "broadcast", event: "reaction", payload: r });
  }, [me]);

  const inviteTo = useCallback((to: string, locationId: string, label: string) => {
    channelRef.current?.send({ type: "broadcast", event: "invite", payload: { key: crypto.randomUUID(), from: me, to, locationId, label } });
  }, [me]);

  const announceDeleted = useCallback((id: number) => {
    setChat((cur) => cur.filter((m) => m.id !== id));
    channelRef.current?.send({ type: "broadcast", event: "chat_deleted", payload: { id } });
  }, []);

  const pushLocalMessage = useCallback((m: ChatMsg) => {
    setChat((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
  }, []);

  return { roster, chat, events, online, reactions, connected, setPresenceLocation, react, inviteTo, announceDeleted, pushLocalMessage, reload: loadAll, reloadEvents: loadEvents };
}

export type Coven = ReturnType<typeof useCoven>;
