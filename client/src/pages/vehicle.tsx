import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, Fuel, MapPin, Users, Calendar, ArrowLeft, ChevronLeft, ChevronRight,
  Phone, MessageCircle, Star, Shield, Bike
} from "lucide-react";
import type { VehicleWithOwner } from "@shared/schema";

export default function VehiclePage() {
  const [, params] = useRoute("/vehicle/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentImage, setCurrentImage] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: vehicle, isLoading } = useQuery<VehicleWithOwner>({
    queryKey: ["/api/vehicles", params?.id],
    queryFn: () => fetch(`/api/vehicles/${params?.id}`).then(r => r.json()),
    enabled: !!params?.id,
  });

  const bookingMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/bookings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      setShowBooking(false);
      toast({ title: "Booking request sent!", description: "The owner will confirm your booking soon." });
    },
    onError: () => {
      toast({ title: "Booking failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const handleBook = () => {
    if (!user) { navigate("/login"); return; }
    setShowBooking(true);
  };

  const handleSubmitBooking = () => {
    if (!startDate || !endDate || !vehicle) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const total = (days * Number(vehicle.pricePerDay)).toFixed(2);

    bookingMutation.mutate({
      vehicleId: vehicle.id,
      startDate,
      endDate,
      totalPrice: total,
      notes: notes || undefined,
    });
  };

  const calcPrice = () => {
    if (!startDate || !endDate || !vehicle) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return { days, total: (days * Number(vehicle.pricePerDay)).toFixed(2) };
  };

  const priceCalc = calcPrice();

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-[4/3] rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Bike size={48} className="text-muted-foreground" />
        <h2 className="text-xl font-semibold">Vehicle not found</h2>
        <Button variant="outline" onClick={() => navigate("/")} >
          <ArrowLeft size={14} className="mr-2" /> Back to marketplace
        </Button>
      </div>
    );
  }

  const images = vehicle.images?.length ? vehicle.images : [
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80"
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6 -ml-2" data-testid="button-back">
          <ArrowLeft size={14} className="mr-1.5" /> Back to marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Image gallery */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted" data-testid="vehicle-gallery">
              <img
                src={images[currentImage]}
                alt={vehicle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

              {/* Nav arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentImage(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {vehicle.featured && (
                  <Badge className="bg-amber-500 text-white"><Star size={10} className="mr-1" fill="white" /> Featured</Badge>
                )}
                <Badge className={vehicle.engineType === "electric" ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"}>
                  {vehicle.engineType === "electric" ? <><Zap size={10} className="mr-1" />Electric</> : <><Fuel size={10} className="mr-1" />Petrol</>}
                </Badge>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? "bg-white scale-110" : "bg-white/60"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === currentImage ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Info */}
            <div>
              <h1 className="text-2xl font-bold mb-2" data-testid="text-vehicle-title">{vehicle.title}</h1>

              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{vehicle.brand} {vehicle.model}</span>
                {vehicle.year && <><span>·</span><span>{vehicle.year}</span></>}
                <span>·</span>
                <span className="flex items-center gap-1"><Users size={13} /> {vehicle.seats} seats</span>
                {vehicle.color && <><span>·</span><span>{vehicle.color}</span></>}
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
                <MapPin size={14} className="text-primary" />
                <span>{vehicle.location}</span>
              </div>

              {vehicle.description && (
                <p className="text-muted-foreground leading-relaxed">{vehicle.description}</p>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Zap size={16} />, label: "Engine", value: vehicle.engineType === "electric" ? "Electric" : "Petrol" },
                { icon: <Users size={16} />, label: "Seats", value: `${vehicle.seats} people` },
                { icon: <Shield size={16} />, label: "Status", value: vehicle.available ? "Available" : "Unavailable" },
              ].map((f, i) => (
                <Card key={i} className="border-card-border">
                  <CardContent className="flex flex-col items-center justify-center p-4 text-center gap-1">
                    <div className="text-primary">{f.icon}</div>
                    <div className="text-xs text-muted-foreground">{f.label}</div>
                    <div className="text-sm font-medium">{f.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Owner card */}
            <Card className="border-card-border">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {(vehicle.owner?.displayName || vehicle.owner?.username || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{vehicle.owner?.displayName || vehicle.owner?.username}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {vehicle.owner?.verified && (
                      <Badge variant="secondary" className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                        <Shield size={10} className="mr-1" /> Verified
                      </Badge>
                    )}
                    {vehicle.owner?.subscriptionStatus === "business" && (
                      <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                        <Star size={10} className="mr-1" /> Business
                      </Badge>
                    )}
                  </div>
                </div>
                {vehicle.owner?.phone && (
                  <a href={`tel:${vehicle.owner.phone}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Phone size={14} /> Call
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Booking */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <Card className="border border-card-border shadow-xl">
                <CardContent className="p-6">
                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${vehicle.pricePerDay}</span>
                      <span className="text-muted-foreground">/day</span>
                    </div>
                    {vehicle.pricePerWeek && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ${vehicle.pricePerWeek}/week · {vehicle.pricePerMonth && `$${vehicle.pricePerMonth}/month`}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full h-12 text-base mb-4"
                    onClick={handleBook}
                    disabled={!vehicle.available}
                    data-testid="button-book"
                  >
                    {vehicle.available ? "Book Now" : "Not Available"}
                  </Button>

                  <div className="space-y-2.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-emerald-500 flex-shrink-0" />
                      <span>Verified owner, safe rental</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary flex-shrink-0" />
                      <span>Flexible rental periods</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle size={14} className="text-primary flex-shrink-0" />
                      <span>Owner responds quickly</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="max-w-md" data-testid="dialog-booking">
          <DialogHeader>
            <DialogTitle>Book This Vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{vehicle.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">${vehicle.pricePerDay}/day</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  min={startDate || new Date().toISOString().split("T")[0]}
                  onChange={e => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            {priceCalc && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{priceCalc.days} day{priceCalc.days !== 1 ? "s" : ""} × ${vehicle.pricePerDay}</span>
                  <span className="font-bold text-primary">${priceCalc.total}</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requests or questions..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                data-testid="input-booking-notes"
              />
            </div>

            <Button
              className="w-full"
              disabled={!startDate || !endDate || bookingMutation.isPending}
              onClick={handleSubmitBooking}
              data-testid="button-confirm-booking"
            >
              {bookingMutation.isPending ? "Sending..." : "Send Booking Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
