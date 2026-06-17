"use client";

import { CheckCircle2, Loader2, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/marketing/reveal";
import { usePublicRoomTypes, type PublicRoomType } from "@/lib/features/public";

const money = (v: string | number) => `₨ ${Number(v).toLocaleString()}`;
const sharing = (cap: number) =>
  cap <= 1 ? "Private room" : cap === 2 ? "Sharing for 2" : `Sharing for ${cap}`;

export function RoomsSection() {
  const { roomTypes, loading, error } = usePublicRoomTypes();

  // Feature the type with the most availability.
  const featuredId = roomTypes.reduce<PublicRoomType | null>(
    (best, t) => (!best || t.available_count > best.available_count ? t : best),
    null,
  )?.id;

  return (
    <section id="rooms" className="border-y border-[#ece7df] bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <Reveal className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Rooms & pricing</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#181715] sm:text-4xl">
            Pick the room that fits you
          </h2>
          <p className="mt-3 text-[#6f6a63]">
            Per-term pricing, all-inclusive of Wi-Fi, security and housekeeping.
          </p>
        </Reveal>

        {loading ? (
          <div className="mt-12 flex items-center justify-center gap-2 py-10 text-sm text-[#8a857d]">
            <Loader2 className="size-4 animate-spin" /> Loading rooms…
          </div>
        ) : error || roomTypes.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-[#ece7df] bg-[#faf9f6] p-10 text-center">
            <p className="font-medium text-[#181715]">Rooms coming soon</p>
            <p className="mt-1 text-sm text-[#8a857d]">
              Our team is preparing rooms for the next intake — check back shortly or apply to join the list.
            </p>
            <ButtonLink href="/apply" className="mt-5 rounded-full bg-gold text-gold-foreground hover:bg-gold/90">
              Apply now
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
            {roomTypes.slice(0, 6).map((r, i) => {
              const featured = r.id === featuredId;
              const soldOut = r.available_count <= 0;
              return (
                <Reveal key={r.id} delay={i * 80}>
                  <div
                    className={`flex flex-col rounded-2xl p-7 transition-all hover:-translate-y-1 ${
                      featured ? "bg-[#faf4e8] ring-1 ring-gold/40" : "border border-[#ece7df] bg-[#faf9f6]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider ${featured ? "text-gold" : "text-[#a39c90]"}`}>
                        {featured && <Star className="size-3 fill-current" />}
                        {soldOut ? "Fully booked" : featured ? "Most popular" : `${r.available_count} spot${r.available_count === 1 ? "" : "s"} left`}
                      </span>
                    </div>
                    <h3 className="mt-3 font-heading text-2xl font-semibold text-[#181715]">{r.name}</h3>
                    <p className="text-sm text-[#8a857d]">{sharing(r.capacity)}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-heading text-3xl font-bold text-[#181715]">{money(r.total_price ?? r.base_price)}</span>
                      <span className="text-sm text-[#8a857d]">/ term</span>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {(r.amenities || []).slice(0, 4).map((a) => (
                        <li key={a.id} className="flex items-center gap-2.5 text-sm text-[#4a463f]">
                          <CheckCircle2 className="size-4 shrink-0 text-gold" />
                          {a.name}
                        </li>
                      ))}
                      {(r.amenities || []).length === 0 && (
                        <li className="flex items-center gap-2.5 text-sm text-[#4a463f]">
                          <CheckCircle2 className="size-4 shrink-0 text-gold" /> Wi-Fi · Security · Housekeeping
                        </li>
                      )}
                    </ul>
                    <ButtonLink
                      href="/rooms"
                      className={`mt-7 w-full rounded-full ${
                        featured
                          ? "bg-gold text-gold-foreground hover:bg-gold/90"
                          : "border border-[#1c1a18] bg-transparent text-[#1c1a18] hover:bg-[#1c1a18] hover:text-white"
                      } ${soldOut ? "pointer-events-none opacity-50" : ""}`}
                    >
                      {soldOut ? "Fully booked" : "Browse & book"}
                    </ButtonLink>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
