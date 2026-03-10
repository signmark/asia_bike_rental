import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending Review", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800", icon: Clock },
  active: { label: "Active", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800", icon: XCircle },
};

const bookingStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  completed: { label: "Completed", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!user) { navigate("/login"); return null; }

  const { data: myVehicles, isLoading: vehiclesLoading } = useQuery<VehicleWithOwner[]>({
    queryKey: ["/api/vehicles", "mine"],
    queryFn: () => {
      const params = new URLSearchParams({ ownerId: user.id });
      return fetch(`/api/vehicles?${params}`).then(r => r.json());
    },
  });

  const { data: myBookings, isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/my"],
  });

  const { data: receivedBookings, isLoading: receivedLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings/owner"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vehicles/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Vehicle deleted" });
      setDeleteId(null);
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/bookings/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/owner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({ title: "Booking updated" });
    },
  });

  const activeVehicles = myVehicles?.filter(v => v.status === "active").length ?? 0;
  const pendingBookingsCount = receivedBookings?.filter(b => b.status === "pending").length ?? 0;
  const totalEarnings = receivedBookings?.filter(b => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + Number(b.totalPrice), 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Welcome back, {user.displayName || user.username}!
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user.subscriptionStatus !== "business" && (
              <Link href="/upgrade">
                <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20" data-testid="button-upgrade">
                  <Star size={14} className="mr-1.5" /> Upgrade to Business
                </Button>
              </Link>
            )}
            <Link href="/add-vehicle">
              <Button size="sm" data-testid="button-add-vehicle">
                <Plus size={14} className="mr-1.5" /> Add Vehicle
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "My Vehicles", value: myVehicles?.length ?? 0, icon: Bike, color: "text-primary" },
            { label: "Active Listings", value: activeVehicles, icon: CheckCircle2, color: "text-emerald-500" },
            { label: "Pending Bookings", value: pendingBookingsCount, icon: Clock, color: "text-amber-500" },
            { label: "Total Earnings", value: `$${totalEarnings.toFixed(0)}`, icon: TrendingUp, color: "text-blue-500" },
          ].map((s, i) => (
            <Card key={i} className="border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <s.icon size={16} className={s.color} />
                </div>
                <p className="text-2xl font-bold" data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plan notice for free users */}
        {user.subscriptionStatus !== "business" && (myVehicles?.length ?? 0) >= 1 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-3" data-testid="upgrade-notice">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Free plan limit reached</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Upgrade to Business to list unlimited vehicles and get priority placement.</p>
            </div>
            <Link href="/upgrade">
              <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 flex-shrink-0">
                Upgrade
              </Button>
            </Link>
          </div>
        )}

        <Tabs defaultValue="my-listings">
          <TabsList className="mb-6">
            <TabsTrigger value="my-listings" data-testid="tab-my-listings">
              My Listings {myVehicles?.length ? `(${myVehicles.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="received" data-testid="tab-received-bookings">
              Booking Requests {pendingBookingsCount > 0 && `(${pendingBookingsCount})`}
            </TabsTrigger>
            <TabsTrigger value="my-bookings" data-testid="tab-my-bookings">
              My Rentals {myBookings?.length ? `(${myBookings.length})` : ""}
            </TabsTrigger>
          </TabsList>

          {/* My vehicle listings */}
          <TabsContent value="my-listings">
            {vehiclesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : !myVehicles?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl" data-testid="empty-listings">
                <Bike size={40} className="mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No vehicles yet</h3>
                <p className="text-sm text-muted-foreground mb-4">List your first vehicle to start earning</p>
                <Link href="/add-vehicle">
                  <Button><Plus size={14} className="mr-1.5" /> Add Your First Vehicle</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myVehicles.map(v => {
                  const sc = statusConfig[v.status] || statusConfig.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <Card key={v.id} className="border-card-border" data-testid={`vehicle-row-${v.id}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={v.images?.[0] || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&q=60"}
                            alt={v.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-sm truncate">{v.title}</p>
                            <Badge className={`text-xs ${sc.color} border flex-shrink-0`}>
                              <StatusIcon size={10} className="mr-1" /> {sc.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {v.engineType === "electric" ? <Zap size={10} /> : <Fuel size={10} />}
                              {v.brand} {v.model}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={10} /> {v.location}
                            </span>
                            <span className="font-medium text-foreground">${v.pricePerDay}/day</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/vehicle/${v.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-view-${v.id}`}>
                              <Eye size={14} />
                            </Button>
                          </Link>
                          <Link href={`/edit-vehicle/${v.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-edit-${v.id}`}>
                              <Edit size={14} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(v.id)}
                            data-testid={`button-delete-${v.id}`}
                          >
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

          {/* Received booking requests */}
          <TabsContent value="received">
            {receivedLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : !receivedBookings?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl" data-testid="empty-received">
                <Calendar size={40} className="mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No booking requests yet</h3>
                <p className="text-sm text-muted-foreground">Requests for your vehicles will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivedBookings.map(b => {
                  const sc = bookingStatusConfig[b.status];
                  return (
                    <Card key={b.id} className="border-card-border" data-testid={`booking-received-${b.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{b.vehicle?.title}</p>
                              <Badge className={`text-xs ${sc.color} border-0`}>{sc.label}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users size={10} /> From: {b.renter?.displayName || b.renter?.username}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={10} /> {b.startDate} → {b.endDate}
                              </span>
                              <span className="font-semibold text-foreground">${b.totalPrice}</span>
                            </div>
                            {b.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">"{b.notes}"</p>}
                          </div>
                          {b.status === "pending" && (
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                                onClick={() => updateBookingMutation.mutate({ id: b.id, status: "confirmed" })}
                                data-testid={`button-confirm-${b.id}`}
                              >
                                <CheckCircle2 size={12} className="mr-1" /> Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-destructive border-destructive/50 hover:bg-destructive/10"
                                onClick={() => updateBookingMutation.mutate({ id: b.id, status: "cancelled" })}
                                data-testid={`button-decline-${b.id}`}
                              >
                                <XCircle size={12} className="mr-1" /> Decline
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My rentals (as renter) */}
          <TabsContent value="my-bookings">
            {bookingsLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : !myBookings?.length ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl" data-testid="empty-bookings">
                <Calendar size={40} className="mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No rentals yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Browse the marketplace and book your first ride!</p>
                <Link href="/">
                  <Button variant="outline">Browse Vehicles</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.map(b => {
                  const sc = bookingStatusConfig[b.status];
                  return (
                    <Card key={b.id} className="border-card-border" data-testid={`booking-mine-${b.id}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={b.vehicle?.images?.[0] || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&q=60"}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-sm">{b.vehicle?.title}</p>
                            <Badge className={`text-xs ${sc.color} border-0`}>{sc.label}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar size={10} /> {b.startDate} → {b.endDate}
                            </span>
                            <span className="font-semibold text-foreground">${b.totalPrice}</span>
                          </div>
                        </div>
                        <Link href={`/vehicle/${b.vehicleId}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye size={14} />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the listing from the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
