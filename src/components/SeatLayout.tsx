import { cn } from '@/lib/utils';

export type SeatType = 'standard' | 'vip' | 'premium';

export interface SeatInfo {
  id: string;
  type: SeatType;
}

interface SeatLayoutProps {
  category: string | null;
  totalSeats: number;
  availableSeats: number;
  onSelect: (seat: string) => void;
  selectedSeat: string | null;
  selectedSeats?: string[]; // for multi-select
  bookedSeats?: string[];
  basePrice?: number;
}

// Pricing multipliers
export const TIER_MULTIPLIER: Record<SeatType, number> = {
  standard: 1,
  premium: 1.3,
  vip: 1.5,
};

/**
 * Build the canonical seat list for an event.
 * - Sports: circular stadium rings, exactly `total` seats.
 * - Concert/Music: curved theater rows facing the stage.
 * - Conference/Workshop/General: classic grid.
 * Tier split (always exact `total` count):
 *   First ~10% rows = VIP, next ~20% = Premium, rest = Standard.
 */
export function buildSeats(category: string | null, total: number): SeatInfo[] {
  const cat = (category || 'general').toLowerCase();
  const seats: SeatInfo[] = [];
  if (total <= 0) return seats;

  if (cat === 'sports') {
    // Circular stadium: distribute seats across concentric rings.
    // Inner rings = VIP/Premium, outer = Standard.
    const rings: number[] = [];
    let remaining = total;
    let ring = 0;
    // Each ring holds ring*8 + 8 seats roughly (perimeter grows outward).
    while (remaining > 0) {
      const capacity = 8 + ring * 6;
      const count = Math.min(capacity, remaining);
      rings.push(count);
      remaining -= count;
      ring++;
    }
    const totalRings = rings.length;
    rings.forEach((count, rIdx) => {
      const tier: SeatType = rIdx === 0 ? 'vip' : rIdx <= Math.max(1, Math.floor(totalRings * 0.3)) ? 'premium' : 'standard';
      for (let i = 0; i < count; i++) {
        seats.push({ id: `R${rIdx + 1}-${i + 1}`, type: tier });
      }
    });
    return seats;
  }

  // Default + concert layouts: row/col grid with exact total count.
  let cols: number;
  if (cat === 'concert' || cat === 'music') cols = 10;
  else if (cat === 'conference' || cat === 'workshop') cols = 8;
  else cols = 10;

  const rows = Math.ceil(total / cols);
  const vipRows = Math.max(1, Math.floor(rows * 0.1));
  const premiumRows = Math.max(1, Math.floor(rows * 0.2));

  let placed = 0;
  for (let r = 0; r < rows && placed < total; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    const tier: SeatType = r < vipRows ? 'vip' : r < vipRows + premiumRows ? 'premium' : 'standard';
    for (let c = 0; c < cols && placed < total; c++) {
      seats.push({ id: `${rowLabel}${c + 1}`, type: tier });
      placed++;
    }
  }
  return seats;
}

const tierClass = (type: SeatType, isBooked: boolean, isSelected: boolean) =>
  cn(
    'rounded-md text-[10px] font-medium transition-all duration-200 border flex items-center justify-center',
    isBooked && 'bg-muted text-muted-foreground/40 border-muted cursor-not-allowed',
    !isBooked && !isSelected && type === 'vip' && 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-200 hover:scale-110',
    !isBooked && !isSelected && type === 'premium' && 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:bg-purple-200 hover:scale-110',
    !isBooked && !isSelected && type === 'standard' && 'bg-card border-border text-foreground hover:bg-accent hover:scale-110',
    isSelected && 'bg-primary text-primary-foreground border-primary scale-110 ring-2 ring-primary/40 shadow-md',
  );

function CircularStadium({
  seats,
  bookedSet,
  selectedSet,
  onSelect,
}: {
  seats: SeatInfo[];
  bookedSet: Set<string>;
  selectedSet: Set<string>;
  onSelect: (id: string) => void;
}) {
  // Group seats by ring (R1, R2, ...)
  const rings = new Map<number, SeatInfo[]>();
  seats.forEach((s) => {
    const ring = parseInt(s.id.split('-')[0].replace('R', ''), 10);
    if (!rings.has(ring)) rings.set(ring, []);
    rings.get(ring)!.push(s);
  });

  const totalRings = rings.size;
  const baseRadius = 70; // px
  const ringStep = 38;
  const size = 2 * (baseRadius + totalRings * ringStep) + 60;
  const center = size / 2;

  return (
    <div className="overflow-auto">
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        {/* Field/Court */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 border-2 border-emerald-500/40 flex items-center justify-center text-xs font-semibold text-emerald-700 dark:text-emerald-300"
          style={{
            width: baseRadius * 1.6,
            height: baseRadius * 1.6,
            left: center - baseRadius * 0.8,
            top: center - baseRadius * 0.8,
          }}
        >
          🏟️ FIELD
        </div>

        {Array.from(rings.entries()).map(([ringIdx, ringSeats]) => {
          const radius = baseRadius + ringIdx * ringStep;
          const count = ringSeats.length;
          return ringSeats.map((seat, i) => {
            const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
            const x = center + radius * Math.cos(angle) - 14;
            const y = center + radius * Math.sin(angle) - 14;
            const isBooked = bookedSet.has(seat.id);
            const isSelected = selectedSet.has(seat.id);
            return (
              <button
                key={seat.id}
                disabled={isBooked}
                onClick={() => onSelect(seat.id)}
                title={`${seat.id} — ${seat.type.toUpperCase()}`}
                className={cn(tierClass(seat.type, isBooked, isSelected), 'absolute w-7 h-7')}
                style={{ left: x, top: y }}
              >
                {i + 1}
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}

function CurvedTheater({
  seats,
  bookedSet,
  selectedSet,
  onSelect,
}: {
  seats: SeatInfo[];
  bookedSet: Set<string>;
  selectedSet: Set<string>;
  onSelect: (id: string) => void;
}) {
  // Group by row letter
  const byRow = new Map<string, SeatInfo[]>();
  seats.forEach((s) => {
    const row = s.id.match(/^[A-Z]+/)?.[0] || 'A';
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row)!.push(s);
  });
  const rows = Array.from(byRow.entries());

  return (
    <div className="space-y-2">
      <div className="mx-auto w-3/4 py-2 rounded-t-[100%] bg-gradient-to-b from-primary/30 to-primary/5 text-center text-xs font-medium text-primary border border-primary/30 border-b-0">
        🎵 STAGE
      </div>
      <div className="overflow-x-auto pt-2">
        <div className="flex flex-col items-center gap-1.5 w-fit mx-auto">
          {rows.map(([row, rowSeats], rIdx) => {
            // Curve: outer rows wider/more spaced
            const padding = rIdx * 2;
            return (
              <div key={row} className="flex items-center gap-1.5" style={{ paddingInline: padding }}>
                <div className="w-5 text-[10px] font-mono text-muted-foreground text-right">{row}</div>
                {rowSeats.map((seat) => {
                  const isBooked = bookedSet.has(seat.id);
                  const isSelected = selectedSet.has(seat.id);
                  const num = seat.id.replace(/^[A-Z]+/, '');
                  return (
                    <button
                      key={seat.id}
                      disabled={isBooked}
                      onClick={() => onSelect(seat.id)}
                      title={`${seat.id} — ${seat.type.toUpperCase()}`}
                      className={cn(tierClass(seat.type, isBooked, isSelected), 'w-7 h-7')}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GridLayout({
  seats,
  bookedSet,
  selectedSet,
  onSelect,
  category,
}: {
  seats: SeatInfo[];
  bookedSet: Set<string>;
  selectedSet: Set<string>;
  onSelect: (id: string) => void;
  category: string | null;
}) {
  const cat = (category || '').toLowerCase();
  const cols = cat === 'conference' || cat === 'workshop' ? 8 : 10;
  const byRow = new Map<string, SeatInfo[]>();
  seats.forEach((s) => {
    const row = s.id.match(/^[A-Z]+/)?.[0] || 'A';
    if (!byRow.has(row)) byRow.set(row, []);
    byRow.get(row)!.push(s);
  });

  return (
    <div className="space-y-3">
      <div className="mx-auto w-3/4 py-2 rounded-lg bg-primary/10 text-center text-xs font-medium text-primary border border-primary/20">
        🎤 STAGE
      </div>
      <div className="overflow-x-auto">
        <div className="grid gap-1.5 mx-auto w-fit" style={{ gridTemplateColumns: `24px repeat(${cols}, 1fr)` }}>
          {Array.from(byRow.entries()).flatMap(([row, rowSeats]) => [
            <div key={`l-${row}`} className="flex items-center justify-center text-xs font-mono text-muted-foreground w-6">
              {row}
            </div>,
            ...rowSeats.map((seat) => {
              const isBooked = bookedSet.has(seat.id);
              const isSelected = selectedSet.has(seat.id);
              const num = seat.id.replace(/^[A-Z]+/, '');
              return (
                <button
                  key={seat.id}
                  disabled={isBooked}
                  onClick={() => onSelect(seat.id)}
                  title={`${seat.id} — ${seat.type.toUpperCase()}`}
                  className={cn(tierClass(seat.type, isBooked, isSelected), 'w-8 h-8')}
                >
                  {num}
                </button>
              );
            }),
            // pad with empty cells so the row stays aligned to `cols` width
            ...Array.from({ length: Math.max(0, cols - rowSeats.length) }, (_, i) => (
              <div key={`pad-${row}-${i}`} className="w-8 h-8" />
            )),
          ])}
        </div>
      </div>
    </div>
  );
}

export default function SeatLayout({
  category,
  totalSeats,
  onSelect,
  selectedSeat,
  selectedSeats,
  bookedSeats: bookedSeatsList = [],
}: SeatLayoutProps) {
  const seats = buildSeats(category, totalSeats);
  const bookedSet = new Set(bookedSeatsList);
  const selectedSet = new Set(selectedSeats ?? (selectedSeat ? [selectedSeat] : []));
  const cat = (category || '').toLowerCase();

  return (
    <div className="space-y-5">
      {cat === 'sports' ? (
        <CircularStadium seats={seats} bookedSet={bookedSet} selectedSet={selectedSet} onSelect={onSelect} />
      ) : cat === 'concert' || cat === 'music' ? (
        <CurvedTheater seats={seats} bookedSet={bookedSet} selectedSet={selectedSet} onSelect={onSelect} />
      ) : (
        <GridLayout seats={seats} bookedSet={bookedSet} selectedSet={selectedSet} onSelect={onSelect} category={category} />
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs flex-wrap pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700" />
          <span>VIP <span className="text-muted-foreground">(+50%)</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700" />
          <span>Premium <span className="text-muted-foreground">(+30%)</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-card border border-border" />
          <span>Standard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted border border-muted" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-primary border border-primary" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
