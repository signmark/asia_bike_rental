import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/language";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Users, Bike, CreditCard, CheckCircle2, XCircle, Clock,
  TrendingUp, Eye, Star, AlertTriangle, MoreVertical, UserCog,
  Crown, UserMinus, ChevronUp, ChevronDown, MapPin, Zap, Fuel,
} from "lucide-react";
import { Link } from "wouter";
import type { VehicleWithOwner, PaymentWithUser } from "@shared/schema";

export default function Admin() {
  const { user } = useAuth();
  const { t } = useLang();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [vehicleFilter, setVehicleFilter] = useState("pending");

  if (!user) { navigate("/login"); return null; }
  if (user.role !== "admin") { navigate("/"); return null; }

  const { data: stats } = useQuery<any>({ queryKey: ["/api/admin/stats"] });
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<VehicleWithOwner[]>({
    queryKey: ["/api/vehicles/admin", vehicleFilter],
    queryFn: () => fetch(`/api/vehicles/admin?status=${vehicleFilter}`).then(r => r.json()),
  });
  const { data: payments, isLoading: paymentsLoading } = useQuery<PaymentWithUser[]>({
    queryKey: ["/api/payments/admin"],
  });
  const { data: allUsers, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      apiRequest("PATCH", `/api/vehicles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: t.admin.updated });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/payments/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: t.admin.updated });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      apiRequest("PATCH", `/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: t.admin.updated });
    },
  });

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    rejected: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    approved: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    business: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    free: "bg-muted text-muted-foreground",
  };

  const statItems = stats ? [
    { label: t.admin.totalUsers, value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: t.admin.business, value: stats.businessUsers, icon: Star, color: "text-amber-500" },
    { label: t.admin.activeVehicles, value: stats.totalVehicles, icon: Bike, color: "text-emerald-500" },
    { label: t.admin.pendingReview, value: stats.pendingVehicles, icon: Clock, color: "text-orange-500" },
    { label: t.admin.bookings, value: stats.totalBookings, icon: CheckCircle2, color: "text-primary" },
    { label: t.admin.revenue, value: `$${stats.totalRevenue?.toFixed(0) || 0}`, icon: TrendingUp, color: "text-emerald-600" },
    { label: t.admin.pendingPayments, value: stats.pendingPayments, icon: AlertTriangle, color: "text-red-500" },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.admin.title}</h1>
            <p className="text-sm text-muted-foreground">{t.admin.subtitle}</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            {statItems.map((s, i) => (
              <Card key={i} className="border-card-border">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon size={13} className={s.color} />
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                  <p className="text-xl font-bold" data-testid={`admin-stat-${i}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="vehicles">
          <TabsList className="mb-6">
            <TabsTrigger value="vehicles" data-testid="admin-tab-vehicles">
              {t.admin.vehiclesTab} {stats?.pendingVehicles > 0 && `(${stats.pendingVehicles})`}
            </TabsTrigger>
            <TabsTrigger value="payments" data-testid="admin-tab-payments">
              {t.admin.paymentsTab} {stats?.pendingPayments > 0 && `(${stats.pendingPayments})`}
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="admin-tab-users">
              {t.admin.usersTab}
            </TabsTrigger>
          </TabsList>

          {/* ── Vehicles ── */}
          <TabsContent value="vehicles">
            <div className="flex gap-2 mb-4">
              {["pending", "active", "rejected"].map(s => (
                <button
                  key={s}
                  onClick={() => setVehicleFilter(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                    vehicleFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  data-testid={`filter-vehicle-${s}`}
                >
                  {s === "pending" ? t.admin.pending : s === "active" ? t.admin.active : t.admin.rejected}
                </button>
              ))}
            </div>

            {vehiclesLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : !vehicles?.length ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl" data-testid="empty-vehicles-admin">
                <Bike size={36} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t.admin.noVehicles} ({vehicleFilter})</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map(v => (
                  <Card key={v.id} className="border-card-border" data-testid={`admin-vehicle-${v.id}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={v.images?.[0] || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&q=60"}
                          alt={v.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-medium text-sm truncate">{v.title}</p>
                          <Badge className={`text-xs ${statusColor[v.status] || ""} border-0 capitalize flex-shrink-0`}>{v.status}</Badge>
                          {v.featured && (
                            <Badge className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 flex-shrink-0">
                              <Star size={9} className="mr-0.5" fill="currentColor" /> {t.admin.featured}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {v.engineType === "electric" ? <Zap size={10} /> : <Fuel size={10} />}
                            {v.brand} {v.model} {v.year && `(${v.year})`}
                          </span>
                          <span className="flex items-center gap-1"><MapPin size={10} /> {v.location}</span>
                          <span>{t.admin.owner}: {v.owner?.displayName || v.owner?.username}</span>
                          <span className="font-medium text-foreground">${v.pricePerDay}/day</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Featured toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-2.5 text-xs gap-1 ${v.featured ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30" : "text-muted-foreground hover:text-amber-500"}`}
                          onClick={() => updateVehicleMutation.mutate({ id: v.id, data: { featured: !v.featured } })}
                          data-testid={`admin-featured-${v.id}`}
                        >
                          <Star size={12} fill={v.featured ? "currentColor" : "none"} />
                          {v.featured ? t.admin.unfeature : t.admin.feature}
                        </Button>

                        <Link href={`/vehicle/${v.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`admin-view-vehicle-${v.id}`}>
                            <Eye size={14} />
                          </Button>
                        </Link>
                        {v.status !== "active" && (
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                            onClick={() => updateVehicleMutation.mutate({ id: v.id, data: { status: "active" } })}
                            data-testid={`admin-approve-vehicle-${v.id}`}
                          >
                            <CheckCircle2 size={12} className="mr-1" /> {t.admin.approve}
                          </Button>
                        )}
                        {v.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-destructive border-destructive/50 hover:bg-destructive/10"
                            onClick={() => updateVehicleMutation.mutate({ id: v.id, data: { status: "rejected" } })}
                            data-testid={`admin-reject-vehicle-${v.id}`}
                          >
                            <XCircle size={12} className="mr-1" /> {t.admin.reject}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Payments ── */}
          <TabsContent value="payments">
            {paymentsLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : !payments?.length ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl" data-testid="empty-payments">
                <CreditCard size={36} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t.admin.noPayments}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map(p => (
                  <Card key={p.id} className="border-card-border" data-testid={`admin-payment-${p.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CreditCard size={16} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm">{p.user?.displayName || p.user?.username}</p>
                          <Badge className={`text-xs ${statusColor[p.status] || ""} border-0 capitalize`}>{p.status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{p.user?.email}</span>
                          <span>@{p.user?.username}</span>
                          <span className="font-semibold text-foreground">${p.amount} — {p.plan}</span>
                          <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                        {p.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {p.notes}</p>}
                        {p.proofImage && (
                          <a href={p.proofImage} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-0.5 block">
                            {t.admin.viewProof} →
                          </a>
                        )}
                      </div>
                      {p.status === "pending" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white"
                            onClick={() => updatePaymentMutation.mutate({ id: p.id, status: "approved" })}
                            data-testid={`admin-approve-payment-${p.id}`}
                          >
                            <CheckCircle2 size={12} className="mr-1" /> {t.admin.approve}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-destructive border-destructive/50 hover:bg-destructive/10"
                            onClick={() => updatePaymentMutation.mutate({ id: p.id, status: "rejected" })}
                            data-testid={`admin-reject-payment-${p.id}`}
                          >
                            <XCircle size={12} className="mr-1" /> {t.admin.reject}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Users ── */}
          <TabsContent value="users">
            {usersLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
              <div className="space-y-2">
                {allUsers?.map(u => {
                  const isBusiness = u.subscriptionStatus === "business";
                  const isAdmin = u.role === "admin";
                  const initials = (u.displayName || u.username || "?").slice(0, 2).toUpperCase();
                  return (
                    <Card key={u.id} className="border-card-border" data-testid={`admin-user-${u.id}`}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="w-9 h-9 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="font-medium text-sm">{u.displayName || u.username}</p>
                            {isBusiness && (
                              <Badge className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0 gap-1">
                                <Crown size={9} /> Business
                              </Badge>
                            )}
                            {isAdmin && (
                              <Badge className="text-xs bg-primary/10 text-primary border-0 gap-1">
                                <Shield size={9} /> Admin
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0 text-xs text-muted-foreground">
                            <span>@{u.username}</span>
                            <span>{u.email}</span>
                            {u.phone && <span>{u.phone}</span>}
                            <span>{t.admin.joined}: {new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {/* Actions — don't allow modifying own account */}
                        {u.id !== user.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" data-testid={`admin-user-menu-${u.id}`}>
                                <MoreVertical size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {/* Subscription */}
                              {isBusiness ? (
                                <DropdownMenuItem
                                  onClick={() => updateUserMutation.mutate({
                                    id: u.id,
                                    data: { subscriptionStatus: "free", role: u.role === "business" ? "user" : u.role },
                                  })}
                                  className="gap-2 text-destructive"
                                  data-testid={`admin-downgrade-${u.id}`}
                                >
                                  <ChevronDown size={13} /> {t.admin.downgradeToFree}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => updateUserMutation.mutate({
                                    id: u.id,
                                    data: { subscriptionStatus: "business", role: "business" },
                                  })}
                                  className="gap-2 text-amber-600 dark:text-amber-400"
                                  data-testid={`admin-upgrade-${u.id}`}
                                >
                                  <Crown size={13} /> {t.admin.upgradeToBusiness}
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {/* Role */}
                              {isAdmin ? (
                                <DropdownMenuItem
                                  onClick={() => updateUserMutation.mutate({
                                    id: u.id,
                                    data: { role: isBusiness ? "business" : "user" },
                                  })}
                                  className="gap-2"
                                  data-testid={`admin-remove-admin-${u.id}`}
                                >
                                  <UserMinus size={13} /> {t.admin.removeAdmin}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => updateUserMutation.mutate({
                                    id: u.id,
                                    data: { role: "admin" },
                                  })}
                                  className="gap-2"
                                  data-testid={`admin-make-admin-${u.id}`}
                                >
                                  <UserCog size={13} /> {t.admin.makeAdmin}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
