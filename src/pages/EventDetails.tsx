import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Users, ArrowLeft, Loader2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { buyTicketOnChain } from '@/services/blockchainService';
import SeatLayout, { buildSeats, TIER_MULTIPLIER } from '@/components/SeatLayout';
import type { Tables } from '@/integrations/supabase/types';

const MAX_TICKETS = 5;

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { walletAddress, connectWallet } = useWallet();
  const [event, setEvent] = useState<Tables<'events'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [desiredQty, setDesiredQty] = useState(1);
  const [bookingStep, setBookingStep] = useState<'confirm' | 'blockchain' | 'done'>('confirm');
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);

  const fetchEventAndSeats = async () => {
    const [{ data: eventData }, { data: seatsData }] = await Promise.all([
      supabase.from('events').select('*').eq('id', id!).single(),
      supabase.rpc('get_booked_seats', { p_event_id: id! }),
    ]);
    setEvent(eventData);
    setBookedSeats((seatsData as string[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEventAndSeats(); }, [id]);

  // Tier-aware pricing
  const seatTierMap = event ? new Map(buildSeats(event.category, event.total_seats).map((s) => [s.id, s.type])) : new Map();
  const basePrice = event ? Number(event.price) : 0;
  const seatPrice = (seatId: string) => {
    const tier = seatTierMap.get(seatId) ?? 'standard';
    return basePrice * TIER_MULTIPLIER[tier];
  };
  const totalPrice = selectedSeats.reduce((sum, s) => sum + seatPrice(s), 0);

  const toggleSeat = (seat: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seat)) return prev.filter((s) => s !== seat);
      if (prev.length >= desiredQty) {
        toast({ title: `Only ${desiredQty} ticket${desiredQty > 1 ? 's' : ''} selected`, description: 'Increase quantity or deselect a seat first.' });
        return prev;
      }
      return [...prev, seat];
    });
  };

  const handleBook = async () => {
    if (!user) { navigate('/auth'); return; }
    if (selectedSeats.length === 0) {
      toast({ title: 'Select Seats', description: 'Please choose at least one seat before booking.', variant: 'destructive' });
      return;
    }
    if (selectedSeats.length !== desiredQty) {
      toast({ title: 'Seat count mismatch', description: `Please select exactly ${desiredQty} seat(s).`, variant: 'destructive' });
      return;
    }
    setBooking(true);
    setBookingStep('confirm');

    try {
      const mintedTokens: number[] = [];
      // Book each seat sequentially. On-chain mint per ticket if wallet connected.
      for (const seat of selectedSeats) {
        let nftTokenId: number | null = null;
        if (walletAddress && event) {
          setBookingStep('blockchain');
          try {
            nftTokenId = await buyTicketOnChain(event.title);
          } catch (chainErr: any) {
            console.error('Blockchain mint failed:', chainErr);
            const msg = chainErr?.message || chainErr?.reason || '';
            const isInsufficientFunds = msg.toLowerCase().includes('insufficient') || msg.includes('funds');
            toast({
              title: isInsufficientFunds ? 'Insufficient Gas Fees or Funds' : 'Blockchain Transaction Failed',
              description: isInsufficientFunds
                ? 'You do not have enough ETH in your wallet to pay for network fees.'
                : (chainErr?.reason || chainErr?.message || 'Transaction was rejected or failed.'),
              variant: 'destructive',
            });
            setBooking(false);
            setBookingStep('confirm');
            return;
          }
        }

        setBookingStep('confirm');
        const { data, error } = await supabase.functions.invoke('book-ticket', {
          body: {
            eventId: id!,
            seatNumber: seat,
            walletAddress: walletAddress || null,
            nftTokenId: nftTokenId ? String(nftTokenId) : null,
          },
        });
        if (error) throw error;
        if (nftTokenId) mintedTokens.push(nftTokenId);
      }

      setBookingStep('done');
      toast({
        title: `${selectedSeats.length} Ticket${selectedSeats.length > 1 ? 's' : ''} Booked! 🎉`,
        description: `Seats: ${selectedSeats.join(', ')}.${mintedTokens.length ? ` NFTs: #${mintedTokens.join(', #')}` : ''} Check My Tickets.`,
      });
      setBookingOpen(false);
      setSelectedSeats([]);
      await fetchEventAndSeats();
    } catch (err: any) {
      toast({ title: 'Booking Failed', description: err.message, variant: 'destructive' });
    } finally {
      setBooking(false);
      setBookingStep('confirm');
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading...</div>;
  if (!event) return <div className="container mx-auto px-4 py-16 text-center">Event not found</div>;

  const maxAllowed = Math.min(MAX_TICKETS, event.available_seats);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="h-64 md:h-full rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span className="text-6xl">🎪</span>
          )}
        </div>

        <div>
          <Badge variant="secondary" className="mb-2">{event.category || 'general'}</Badge>
          <h1 className="font-display text-3xl font-bold mb-4">{event.title}</h1>
          <p className="text-muted-foreground mb-6">{event.description}</p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-semibold text-lg">${basePrice.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">(Premium +30%, VIP +50%)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span>{event.available_seats} of {event.total_seats} seats available</span>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <div className="w-48 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(event.available_seats / event.total_seats) * 100}%` }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-medium ${event.available_seats > 0 ? 'text-secondary' : 'text-destructive'}`}>
                  {event.available_seats > 0 ? 'Available' : 'Sold Out'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quantity stepper */}
          <div className="flex items-center justify-between rounded-lg border p-3 mb-3">
            <div>
              <p className="text-sm font-medium">Number of tickets</p>
              <p className="text-xs text-muted-foreground">Max {MAX_TICKETS} per booking</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const next = Math.max(1, desiredQty - 1);
                  setDesiredQty(next);
                  if (selectedSeats.length > next) setSelectedSeats(selectedSeats.slice(0, next));
                }}
                disabled={desiredQty <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-8 text-center font-semibold">{desiredQty}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDesiredQty(Math.min(maxAllowed, desiredQty + 1))}
                disabled={desiredQty >= maxAllowed}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {!walletAddress && (
            <Button variant="outline" className="w-full mb-3 gap-2" onClick={connectWallet}>
              🦊 Connect Wallet for On-Chain Ticket
            </Button>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={event.available_seats <= 0 || selectedSeats.length === 0}
            onClick={() => setBookingOpen(true)}
          >
            {event.available_seats <= 0
              ? 'Sold Out'
              : selectedSeats.length === 0
              ? `Select ${desiredQty} Seat${desiredQty > 1 ? 's' : ''}`
              : `Book ${selectedSeats.length} Ticket${selectedSeats.length > 1 ? 's' : ''} — $${totalPrice.toFixed(2)}`}
          </Button>
        </div>
      </div>

      {/* Seat Selection Section */}
      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold mb-1">Select Your Seat{desiredQty > 1 ? 's' : ''}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Pick {desiredQty} seat{desiredQty > 1 ? 's' : ''} — selected {selectedSeats.length}/{desiredQty}
        </p>
        <Card>
          <CardContent className="p-6">
            <SeatLayout
              category={event.category}
              totalSeats={event.total_seats}
              availableSeats={event.available_seats}
              onSelect={toggleSeat}
              selectedSeat={null}
              selectedSeats={selectedSeats}
              bookedSeats={bookedSeats}
              basePrice={basePrice}
            />
          </CardContent>
        </Card>
        {selectedSeats.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2 animate-fade-in">
            {selectedSeats.map((s) => (
              <Badge key={s} className="text-sm px-3 py-1.5 cursor-pointer" onClick={() => toggleSeat(s)}>
                {s} — ${seatPrice(s).toFixed(2)} ✕
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>You are about to book {selectedSeats.length} ticket(s) for {event.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <p className="text-sm"><strong>Event:</strong> {event.title}</p>
            <p className="text-sm"><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            <div className="text-sm">
              <strong>Seats:</strong>
              <ul className="ml-4 mt-1 space-y-0.5">
                {selectedSeats.map((s) => (
                  <li key={s} className="text-xs">
                    {s} ({seatTierMap.get(s)?.toUpperCase() ?? 'STANDARD'}) — ${seatPrice(s).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm font-semibold pt-2 border-t"><strong>Total:</strong> ${totalPrice.toFixed(2)}</p>
            {walletAddress && (
              <>
                <p className="text-sm"><strong>Wallet:</strong> {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                <p className="text-xs text-primary">⛓️ Each ticket will be minted on-chain (Sepolia)</p>
              </>
            )}
            {!walletAddress && (
              <p className="text-xs text-muted-foreground">💡 Connect your wallet to also mint on-chain NFT tickets</p>
            )}
          </div>
          {booking && bookingStep === 'blockchain' && (
            <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              Minting on-chain... Confirm in MetaMask
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)} disabled={booking}>Cancel</Button>
            <Button onClick={handleBook} disabled={booking}>
              {booking ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {bookingStep === 'blockchain' ? 'Minting...' : 'Booking...'}
                </span>
              ) : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
