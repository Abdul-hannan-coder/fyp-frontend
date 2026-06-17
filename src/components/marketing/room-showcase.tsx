import { ArrowUpRight, BedDouble, Star, Wifi, Wind } from "lucide-react";

export function RoomShowcase() {
  return (
    <div className="relative mx-auto max-w-md">
      {/* soft gold halo, very subtle */}
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-gold/10 blur-2xl" />

      <div className="animate-float overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-xl shadow-gold/10">
        {/* warm "photo" area */}
        <div className="relative h-52 bg-gradient-to-br from-[#f6ead2] via-[#f1dcb4] to-[#e8c98c]">
          <BedDouble className="absolute bottom-5 right-5 size-20 text-[#b9893f]/35" strokeWidth={1.2} />
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-foreground">
            <span className="size-1.5 rounded-full bg-success" /> Available now
          </div>
          <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background">
            <Star className="size-3 fill-gold text-gold" /> 4.8
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-heading text-xl font-semibold tracking-tight">Standard Double</p>
              <p className="text-sm text-muted-foreground">Block A · sharing for 2</p>
            </div>
            <div className="text-right">
              <p className="font-heading text-2xl font-bold text-foreground">₨85k</p>
              <p className="text-xs text-muted-foreground">/ term</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { icon: Wind, label: "AC" },
              { icon: Wifi, label: "Wi-Fi" },
              { icon: BedDouble, label: "Attached bath" },
            ].map((a) => (
              <span
                key={a.label}
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                <a.icon className="size-3.5" /> {a.label}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">10 rooms</span> left this term
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
              Book <ArrowUpRight className="size-4 text-gold" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
