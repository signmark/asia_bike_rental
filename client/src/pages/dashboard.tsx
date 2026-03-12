import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/language";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Bike, Plus, Star, MapPin, Edit, Trash2, Eye, Clock, CheckCircle2,
  XCircle, Calendar, Users, TrendingUp, AlertTriangle, Zap, Fuel
} from "lucide-react";
import type { VehicleWithOwner, BookingWithDetails } from "@shared/schema";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  rejected: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
};
const statusIcons: Record<string, any> = { pending: Clock, active: CheckCircle2, rejected: XCircle };
const bookingColors: Record<string, string> = {
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  confirmed: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  completed: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!user) { navigate("/login"); return null; }

  const { data: myVehicles = [], isLoading: vehiclesLoading } = useQuery<VehicleWithOwner[]>({
    queryKey: ["/api/vehicles", "mine", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ ownerId: user!.id });
      const r = await fetch(`/api/vehicles?${params}`, { credentials: "include" });
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });

  const { data: myBookings = [], isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/my"],
    enabled: !!user,
  });

  const { data: receivedBookings = [], isLoading: receivedLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/owner"],
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vehicles/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: t.dashboard.vehicleDeleted });
      setDeleteId(null);
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/bookings/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/owner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({ title: t.dashboard.bookingUpdated });
    },
  });

  const activeVehicles = myVehicles.filter(v => v.status === "active").length;
  const pendingBookingsCount = receivedBookings.filter(b => b.status === "pending").length;
  const totalEarnings = receivedBookings
    .filter(b => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + Number(b.totalPrice), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {t.dashboard.welcome}, {user.displayName || user.username}!
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user.subscriptionStatus !== "business" && (
              <Link href="/upgrade">
                <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20" data-testid="button-upgrade">
                  <Star size={14} className="mr-1.5" /> {t.dashboard.upgradeBtn}
                </Button>
              </Link>
            )}
            <Link href="/add-vehicle">
              <Button size="sm" data-testid="button-add-vehicle">
                <Plus size={14} className="mr-1.5" /> {t.dashboard.addVehicle}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: t.dashboard.myVehicles, value: myVehicles?.length ?? 0, icon: Bike, color: "text-primary" },
            { label: t.dashboard.activeListings, value: activeVehicles, icon: CheckCircle2, color: "text-emerald-500" },
            { label: t.dashboard.pendingBookings, value: pendingBookingsCount, icon: Clock, color: "text-amber-500" },
            { label: t.dashboard.totalEarnings, value: `$${totalEarnings.toFixed(0)}`, icon: TrendingUp, color: "text-blue-500" },
          ].map((s, i) => (
            <Card key={i} className="border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <s.icon size={16} className={s.color} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Free plan notice */}
        {user.subscriptionStatus !== "business" && (myVehicles?.length ?? 0) >= 1 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t.dashboard.freeLimitTitle}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t.dashboard.freeLimitDesc}</p>
            </div>
            <Link href="/upgrade">
              <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 flex-shrink-0">
                {t.dashboard.upgrade}
              </Button>
            </Link>
          </div>
        )}

        <Tabs defaultValue="my-listings">
          <TabsList className="mb-6">
            <TabsTrigger value="my-listings" data-testid="tab-my-listings">
              {t.dashboard.myListings} {myVehicles?.length ? `(${myVehicles.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="received" data-testid="tab-received-bookings">
              {t.dashboard.bookingRequests} {pendingBookingsCount > 0 && `(${pendingBookingsCount})`}
            </TabsTrigger>
            <TabsTrigger value="my-bookings" data-testid="tab-my-bookings">
              {t.dashboard.myRentals} {myBookings?.length ? `(${myBookings.length})` : ""}
            </TabsTrigger>
          </TabsList>

          {/* My listings */}
          <TabsContent value="my-listings">
            {vehiclesLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
            ) : !myVehicles?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl" data-testid="empty-listings">
                <Bike size={40} className="mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">{t.dashboard.noVehicles}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t.dashboard.noVehiclesDesc}</p>
                <Link href="/add-vehicle">
                  <Button><Plus size={14} className="mr-1.5" /> {t.dashboard.addFirst}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myVehicles.map(v => {
                  const color = statusColors[v.status] || statusColors.pending;
                  const StatusIcon = statusIcons[v.status] || Clock;
                  return (
                    <Card key={v.id} className="border-card-border" data-testid={`vehicle-row-${v.id}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img src={v.images?.[0] || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&q=60"} alt={v.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-sm truncate">{v.title}</p>
                            <Badge className={`text-xs ${color} border flex-shrink-0`}>
                              <StatusIcon size={10} className="mr-1" /> {v.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {v.engineType === "electric" ? <Zap size={10} /> : <Fuel size={10} />}
                              {v.brand} {v.model}
                            </span>
                            <span className="flex items-center gap-1"><MapPin size={10} /> {v.location}</span>
                            <span className="font-medium text-foreground">${v.pricePerDay}/day</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/vehicle/${v.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-view-${v.id}`}><Eye size={14} /></Button>
                          </Link>
                          <Link href={`/edit-vehicle/${v.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-edit-${v.id}`}><Edit size={14} /></Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(v.id)} data-testid={`button-delete-${v.id}`}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Received bookings */}
          <TabsContent value="received">
            {receivedLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : !receivedBookings?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl" data-testid="empty-received">
                <Calendar size={40} className="mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">{t.dashboard.noBookingRequests}</h3>
                <p className="text-sm text-muted-foreground">{t.dashboard.noBookingRequestsDesc}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivedBookings.map(b => (
                  <Card key={b.id} className="border-card-border" data-testid={`booking-received-${b.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{b.vehicle?.title}</p>
                            <Badge className={`text-xs ${bookingColors[b.status]} border-0`}>{b.status}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Users size={10} /> {t.dashboard.from} {b.renter?.displayName || b.renter?.username}</span>
                            <span className="flex items-center gap-1"><Calendar size={10} /> {b.startDate} → {b.endDate}</span>
                            <span className="font-semibold text-foreground">${b.totalPrice}</span>
                          </div>
                          {b.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">"{b.notes}"</p>}
                        </div>
                        {b.status === "pending" && (
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => updateBookingMutation.mutate({ id: b.id, status: "confirmed" })} data-testid={`button-confirm-${b.id}`}>
                              <CheckCircle2 size={12} className="mr-1" /> {t.dashboard.confirm}
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => updateBookingMutation.mutate({ id: b.id, status: "cancelled" })} data-testid={`button-decline-${b.id}`}>
                              <XCircle size={12} className="mr-1" /> {t.dashboard.decline}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My rentals */}
          <TabsContent value="my-bookings">
            {bookingsLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : !myBookings?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl" data-testid="empty-bookings">
                <Calendar size={40} className="mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">{t.dashboard.noRentals}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t.dashboard.noRentalsDesc}</p>
                <Link href="/"><Button variant="outline">{t.dashboard.browse}</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.map(b => (
                  <Card key={b.id} className="border-card-border" data-testid={`booking-mine-${b.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img src={b.vehicle?.images?.[0] || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&q=60"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm">{b.vehicle?.title}</p>
                          <Badge className={`text-xs ${bookingColors[b.status]} border-0`}>{b.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {b.startDate} → {b.endDate}</span>
                          <span className="font-semibold text-foreground">${b.totalPrice}</span>
                        </div>
                      </div>
                      <Link href={`/vehicle/${b.vehicleId}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye size={14} /></Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.dashboard.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.dashboard.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.dashboard.cancel}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              {t.dashboard.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
