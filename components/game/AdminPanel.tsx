"use client";
import { useCallback, useEffect, useState } from "react";
import { MiniWitch } from "@/components/art/Witch";
import { api, GameError } from "@/lib/game/api";
import type { ActivityRow } from "@/lib/game/state";
import { ITEMS } from "@/lib/game/catalog";
import { supabaseBrowser } from "@/lib/supabase/client";
import { NavIcon } from "./Icons";

type Char = { id: string; name: string; title: string; description: string; personality: string; look: any; owner_user_id: string | null; claimed_at: string | null; is_owner_character: boolean; pronoun_subject: string; pronoun_object: string; pronoun_possessive: string; pronoun_plural: boolean };
type Invite = { id: string; character_id: string; created_at: string; expires_at: string; revoked_at: string | null; claimed_at: string | null };
type Msg = { id: number; character_id: string | null; body: string; kind: string; created_at: string };

export function AdminPanel({ covenId, siteUrl }: { covenId: string; siteUrl: string }) {
  const supabase = supabaseBrowser();
  const [chars, setChars] = useState<Char[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [config, setConfig] = useState<{ key: string; value: unknown }[]>([]);
  const [items, setItems] = useState<{ id: string; price: number | null; active: boolean }[]>([]);
  const [fresh, setFresh] = useState<Record<string, string>>({});
  const [note, setNote] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  const load = useCallback(async () => {
    const [c, i, m, g, it] = await Promise.all([
      supabase.from("characters").select("*").eq("coven_id", covenId).order("created_at"),
      supabase.from("invitations").select("id,character_id,created_at,expires_at,revoked_at,claimed_at").order("created_at", { ascending: false }).limit(30),
      supabase.from("chat_messages").select("id,character_id,body,kind,created_at").eq("coven_id", covenId).order("created_at", { ascending: false }).limit(40),
      supabase.from("game_config").select("key,value").order("key"),
      supabase.from("items").select("id,price,active").order("id"),
    ]);
    setChars((c.data ?? []) as Char[]);
    setInvites((i.data ?? []) as Invite[]);
    setMsgs((m.data ?? []) as Msg[]);
    setConfig((g.data ?? []).filter((x) => x.key !== "shared_events"));
    setItems(it.data ?? []);
    setActivity(await api.admin.activity().catch(() => []));
  }, [supabase, covenId]);
  useEffect(() => {
    // Initial fetch from Supabase; state is set after the network round trip.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      setNote(ok);
      await load();
    } catch (e) {
      setNote(e instanceof GameError ? e.hint : "That did not work.");
    }
  };

  const createInvite = (id: string) =>
    act(async () => {
      const r = await api.admin.createInvite(id, 7);
      setFresh((f) => ({ ...f, [id]: `${siteUrl}/invite/${r.token}` }));
    }, "Invitation created. The link is shown once: copy or share it now.");

  const share = async (name: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Your Pocket Coven invitation", text: `${name}, your witch is waiting in the seashell.`, url });
        return;
      } catch {
        // Fall through to copy if the share sheet was dismissed or unsupported.
      }
    }
    await navigator.clipboard.writeText(url);
    setNote("Link copied.");
  };

  const status = (i: Invite) => (i.claimed_at ? "claimed" : i.revoked_at ? "revoked" : new Date(i.expires_at) < new Date() ? "expired" : "open");

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="title-script text-3xl text-shell-500">Owner&apos;s Vanity</h1>
        <a href="/play" className="pearl-button ghost !py-1.5 text-sm">Back to the shell</a>
      </div>
      {note && (
        <p className="pearl-panel px-4 py-2 text-sm font-semibold" role="status" onClick={() => setNote(null)}>
          {note}
        </p>
      )}

      <section className="pearl-panel p-4">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold">Founding witches</h2>
        <ul className="space-y-3">
          {chars.map((c) => (
            <li key={c.id} className="rounded-2xl bg-white/70 p-3">
              <div className="flex items-center gap-3">
                <MiniWitch characterId={c.id as never} look={c.look} equipped={{}} mood="happy" size={56} />
                <div className="flex-1">
                  <p className="font-bold">
                    {c.name} <span className="text-xs font-semibold text-ink/55">{c.pronoun_subject}/{c.pronoun_object}</span>
                  </p>
                  <p className="text-xs text-ink/60">{c.owner_user_id ? `Claimed ${new Date(c.claimed_at!).toLocaleDateString()}` : "Unclaimed"}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {!c.owner_user_id && <button className="pearl-button lagoon !px-3 !py-1 text-xs" onClick={() => createInvite(c.id)}>New invite</button>}
                  <button className="pearl-button ghost !px-3 !py-1 text-xs" onClick={() => confirm(`Reset ${c.name}'s stats, wardrobe and room to the start?`) && act(() => api.admin.reset(c.id), `${c.name} reset.`)}>Reset</button>
                  {c.owner_user_id && !c.is_owner_character && (
                    <button className="pearl-button ghost !px-3 !py-1 text-xs" onClick={() => confirm(`Release ${c.name}? Their account loses the witch.`) && act(() => api.admin.release(c.id), `${c.name} released.`)}>Release</button>
                  )}
                  <button className="pearl-button gold !px-3 !py-1 text-xs" onClick={() => act(() => api.admin.grant(c.id, null, null, 50), `Gifted ${c.name} 50 pearls.`)}>+50 pearls</button>
                </div>
              </div>
              {fresh[c.id] && (
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-lagoon-100 p-2">
                  <code className="min-w-0 flex-1 truncate text-xs">{fresh[c.id]}</code>
                  <button className="pearl-button lagoon !px-2 !py-1" onClick={() => share(c.name, fresh[c.id])} aria-label="Share invite"><NavIcon name="share" size={18} /></button>
                  <button className="pearl-button ghost !px-2 !py-1" onClick={() => navigator.clipboard.writeText(fresh[c.id]).then(() => setNote("Link copied."))} aria-label="Copy invite"><NavIcon name="copy" size={18} /></button>
                </div>
              )}
              <CharacterEditor c={c} onSave={(t, d, p, pr) => act(() => api.admin.updateCharacter(c.id, t, d, p, pr), `${c.name} updated.`)} />
            </li>
          ))}
        </ul>
      </section>

      <section className="pearl-panel p-4">
        <h2 className="mb-1 font-[family-name:var(--font-display)] text-lg font-semibold">Who played when</h2>
        <p className="mb-2 text-xs text-ink/60">Last 7 days. Use this to see whether the coven is coming back before building more.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-ink/55">
              <tr>
                <th className="py-1 pr-2">Witch</th>
                <th className="py-1 pr-2">Last seen</th>
                <th className="py-1 pr-2">Days active</th>
                <th className="py-1 pr-2">Actions</th>
                <th className="py-1 pr-2">Chats</th>
                <th className="py-1 pr-2">Gifts</th>
                <th className="py-1">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.id} className="border-t border-shell-100">
                  <td className="py-1.5 pr-2 font-bold">{a.name}</td>
                  <td className="py-1.5 pr-2">{!a.claimed ? "not joined" : a.last_seen ? new Date(a.last_seen).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }) : "never"}</td>
                  <td className="py-1.5 pr-2">{a.days_active_7d} / 7</td>
                  <td className="py-1.5 pr-2">{a.actions_7d} <span className="text-ink/45">({a.actions_today} today)</span></td>
                  <td className="py-1.5 pr-2">{a.chats_7d}</td>
                  <td className="py-1.5 pr-2">{a.gifts_sent_7d}</td>
                  <td className="py-1.5">{a.alerts_on ? "on" : "off"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="pearl-panel p-4">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold">Invitations</h2>
        <ul className="divide-y divide-shell-100 text-sm">
          {invites.map((i) => (
            <li key={i.id} className="flex items-center justify-between py-1.5">
              <span>
                <b>{chars.find((c) => c.id === i.character_id)?.name}</b> · {status(i)} · expires {new Date(i.expires_at).toLocaleDateString()}
              </span>
              {status(i) === "open" && <button className="text-xs font-bold text-shell-500" onClick={() => act(() => api.admin.revokeInvite(i.id), "Invitation revoked.")}>Revoke</button>}
            </li>
          ))}
          {invites.length === 0 && <li className="py-2 text-ink/60">No invitations yet.</li>}
        </ul>
      </section>

      <section className="pearl-panel p-4">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold">Chat moderation</h2>
        <ul className="max-h-72 divide-y divide-shell-100 overflow-y-auto text-sm">
          {msgs.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 py-1.5">
              <span className="min-w-0 flex-1 truncate">
                <b>{m.character_id ?? "system"}</b>: {m.body}
              </span>
              <button className="text-xs font-bold text-shell-500" onClick={() => act(() => api.admin.deleteChat(m.id), "Message removed.")}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="pearl-panel p-4">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold">Game configuration</h2>
        <div className="space-y-2">
          {config.map((c) => (
            <ConfigRow key={c.key} k={c.key} value={c.value} onSave={(v) => act(() => api.admin.setConfig(c.key, v), `${c.key} saved.`)} />
          ))}
        </div>
      </section>

      <section className="pearl-panel p-4">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold">Shop prices</h2>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {items.filter((i) => i.price !== null).map((i) => (
            <PriceRow key={i.id} id={i.id} price={i.price!} active={i.active} onSave={(p, a) => act(() => api.admin.setItem(i.id, p, a), "Item saved.")} />
          ))}
        </div>
      </section>
    </main>
  );
}

function CharacterEditor({ c, onSave }: { c: Char; onSave: (title: string, description: string, personality: string, pronouns: unknown) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(c.title);
  const [description, setDescription] = useState(c.description);
  const [personality, setPersonality] = useState(c.personality);
  const [pron, setPron] = useState(`${c.pronoun_subject}/${c.pronoun_object}/${c.pronoun_possessive}`);
  if (!open) return <button className="mt-1 text-xs font-bold text-lilac-500" onClick={() => setOpen(true)}>Edit description</button>;
  const save = () => {
    const [subject, object, possessive] = pron.split("/").map((s) => s.trim());
    onSave(title, description, personality, { subject, object, possessive, plural: subject === "they" });
    setOpen(false);
  };
  return (
    <div className="mt-2 space-y-1.5">
      <input className="w-full rounded-xl border border-shell-200 px-2 py-1 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
      <input className="w-full rounded-xl border border-shell-200 px-2 py-1 text-sm" value={pron} onChange={(e) => setPron(e.target.value)} aria-label="Pronouns subject/object/possessive" />
      <textarea className="w-full rounded-xl border border-shell-200 px-2 py-1 text-sm" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Description" />
      <textarea className="w-full rounded-xl border border-shell-200 px-2 py-1 text-sm" rows={2} value={personality} onChange={(e) => setPersonality(e.target.value)} aria-label="Personality" />
      <button className="pearl-button !px-3 !py-1 text-xs" onClick={save}>Save</button>
    </div>
  );
}

function ConfigRow({ k, value, onSave }: { k: string; value: unknown; onSave: (v: unknown) => void }) {
  const [text, setText] = useState(JSON.stringify(value));
  const [bad, setBad] = useState(false);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-40 shrink-0 font-semibold">{k}</span>
      <input className={`min-w-0 flex-1 rounded-xl border px-2 py-1 font-mono text-xs ${bad ? "border-[#e64b5d]" : "border-shell-200"}`} value={text} onChange={(e) => setText(e.target.value)} />
      <button
        className="text-xs font-bold text-shell-500"
        onClick={() => {
          try {
            onSave(JSON.parse(text));
            setBad(false);
          } catch {
            setBad(true);
          }
        }}
      >
        Save
      </button>
    </div>
  );
}

function PriceRow({ id, price, active, onSave }: { id: string; price: number; active: boolean; onSave: (p: number, a: boolean) => void }) {
  const [p, setP] = useState(String(price));
  const [a, setA] = useState(active);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="min-w-0 flex-1 truncate font-semibold">{ITEMS.find((i) => i.id === id)?.name ?? id}</span>
      <input className="w-16 rounded-lg border border-shell-200 px-1.5 py-0.5" value={p} inputMode="numeric" onChange={(e) => setP(e.target.value.replace(/\D/g, ""))} />
      <label className="flex items-center gap-1"><input type="checkbox" checked={a} onChange={(e) => setA(e.target.checked)} /> on sale</label>
      <button className="font-bold text-shell-500" onClick={() => onSave(Math.max(1, Number(p) || 1), a)}>Save</button>
    </div>
  );
}
