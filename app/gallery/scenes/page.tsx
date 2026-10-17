"use client";

import { useState } from "react";
import { ACTIVITIES, LOCATIONS } from "@/lib/game/catalog";
import { FLOORS, WALLPAPERS } from "@/lib/game/types";
import { ShellCompact, ShellNightSky } from "@/components/art/ShellCompact";
import { WorldMap } from "@/components/art/WorldMap";
import { KairosMap } from "@/components/art/KairosMap";
import { LocationScene } from "@/components/art/LocationScene";
import { RoomBackdrop, ROOM_FLOOR_BOX } from "@/components/art/RoomBackdrop";
import { JoinRipple, Sparkles, TreasureBurst } from "@/components/art/Sparkles";

function Dot({ c = "#ff9fcb" }: { c?: string }) {
  return <div style={{ width: 26, height: 30, borderRadius: "50% 50% 40% 40%", background: c, border: "2px solid #6b3a5e", boxShadow: "inset 0 3px 0 rgba(255,255,255,.6)" }} />;
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mb-3 mt-10 text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "#6b3a5e" }}>
    {children}
  </h2>
);

export default function ScenesGallery() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [kairos, setKairos] = useState(false);
  const [burst, setBurst] = useState(false);
  const [ripple, setRipple] = useState(0);
  const [cooldown, setCooldown] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)", color: "#6b3a5e" }}>
        Scene gallery
      </h1>
      <p className="text-sm" style={{ color: "#6b3a5e" }}>
        Picked: {picked ?? "nothing yet"}
      </p>

      <H2>Shell compact, closed</H2>
      <section id="shell-closed" className="relative overflow-hidden rounded-3xl py-8">
        <ShellNightSky />
        <ShellCompact open={false} onToggle={() => {}} />
      </section>

      <H2>Shell compact, tap to open</H2>
      <section id="shell-toggle" className="relative overflow-hidden rounded-3xl py-8">
        <ShellNightSky />
        <ShellCompact open={open} onToggle={() => setOpen((o) => !o)}>
          {kairos ? (
            <KairosMap onSelect={setPicked} onBack={() => setKairos(false)} />
          ) : (
            <WorldMap
              onSelect={(id) => (id === "kairos" ? setKairos(true) : setPicked(id))}
              occupants={{ palace: [<Dot key="a" />, <Dot key="b" c="#7ee6dc" />], lagoon: [<Dot key="c" c="#c9b0ff" />] }}
            />
          )}
        </ShellCompact>
      </section>

      <H2>World map (highlight lounge, grotto locked)</H2>
      <section id="worldmap" className="mx-auto max-w-md">
        <WorldMap onSelect={setPicked} highlight="lounge" lockedLocations={["grotto"]} occupants={{ cafe: [<Dot key="a" />, <Dot key="b" c="#ffd36e" />] }} />
      </section>

      <H2>Kairos map</H2>
      <section id="kairosmap" className="mx-auto max-w-md">
        <KairosMap onSelect={setPicked} onBack={() => setPicked("back")} occupants={{ kairos_pool: [<Dot key="a" c="#7ee6dc" />] }} />
      </section>

      <H2>Location scenes</H2>
      <div className="grid gap-6 md:grid-cols-2">
        {LOCATIONS.map((loc) => {
          const hs = ACTIVITIES.filter((a) => a.locationId === loc.id).map((a, i) => ({
            id: a.id,
            label: a.name,
            x: a.spot.x,
            y: a.spot.y,
            disabled: i === 1 || cooldown === a.id,
            badge: i === 1 ? "2m" : undefined,
          }));
          return (
            <section key={loc.id} id={`scene-${loc.id}`}>
              <p className="mb-1 text-sm font-semibold" style={{ color: "#6b3a5e" }}>
                {loc.name} ({loc.id})
              </p>
              <LocationScene locationId={loc.id} hotspots={hs} onHotspot={(id) => setCooldown(id)}>
                <div className="absolute" style={{ left: "46%", top: "70%" }}>
                  <Dot />
                </div>
              </LocationScene>
            </section>
          );
        })}
      </div>

      <H2>Room backdrops</H2>
      <div id="rooms" className="grid gap-4 md:grid-cols-2">
        {WALLPAPERS.map((w, i) => (
          <section key={w}>
            <p className="mb-1 text-sm" style={{ color: "#6b3a5e" }}>
              {w} / {FLOORS[i % FLOORS.length]}
            </p>
            <RoomBackdrop wallpaper={w} floor={FLOORS[i % FLOORS.length]}>
              {i === 0 && (
                <div
                  className="absolute grid"
                  style={{ left: `${ROOM_FLOOR_BOX.x}%`, top: `${ROOM_FLOOR_BOX.y}%`, width: `${ROOM_FLOOR_BOX.w}%`, height: `${ROOM_FLOOR_BOX.h}%`, gridTemplateColumns: "repeat(6, 1fr)", gridTemplateRows: "repeat(4, 1fr)" }}
                >
                  {Array.from({ length: 24 }, (_, k) => (
                    <div key={k} style={{ outline: "1px dashed rgba(107,58,94,.35)" }} />
                  ))}
                </div>
              )}
            </RoomBackdrop>
          </section>
        ))}
        <section>
          <p className="mb-1 text-sm" style={{ color: "#6b3a5e" }}>
            pearl_stripe / moss
          </p>
          <RoomBackdrop wallpaper="pearl_stripe" floor="moss" />
        </section>
      </div>

      <H2>Treasure burst and join ripple</H2>
      <section id="burst" className="relative h-96 overflow-hidden rounded-3xl" style={{ background: "#fff0f7" }}>
        <Sparkles count={10} />
        <div className="absolute left-4 top-4 flex gap-2">
          <button className="pearl-button gold" onClick={() => setBurst((b) => !b)}>
            {burst ? "Hide treasure" : "Find treasure"}
          </button>
          <button className="pearl-button lagoon" onClick={() => setRipple((r) => r + 1)}>
            Friend joins
          </button>
        </div>
        <div className="absolute bottom-8 right-10">
          <div className="relative">
            <Dot c="#7ee6dc" />
            {ripple > 0 && <JoinRipple key={ripple} />}
          </div>
        </div>
        <TreasureBurst show={burst}>
          <svg viewBox="0 0 60 60" width="84" height="84">
            <path d="M30 6L8 30Q10 50 30 54Q50 50 52 30Z" fill="#ffd2e8" stroke="#6b3a5e" strokeWidth="2" />
            <circle cx="30" cy="34" r="8" fill="#fff7fb" stroke="#6b3a5e" strokeWidth="1.5" />
          </svg>
        </TreasureBurst>
      </section>
    </main>
  );
}
