import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VehicleCard } from "@/components/VehicleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, Bike, Zap, Fuel, MapPin, ChevronRight, Star, Shield, Clock } from "lucide-react";
import type { VehicleWithOwner } from "@shared/schema";

const vehicleTypes = [
  { label: "All", value: "" },
  { label: "Bikes", value: "bike" },
  { label: "Scooters", value: "scooter" },
  { label: "Cars", value: "car" },
];

const engineTypes = [
  { label: "All", value: "" },
  { label: "Electric", value: "electric" },
  { label: "Petrol", value: "gasoline" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [engineType, setEngineType] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: vehicles, isLoading } = useQuery<VehicleWithOwner[]>({
    queryKey: ["/api/vehicles", vehicleType, engineType, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (vehicleType) params.set("type", vehicleType);
      if (engineType) params.set("engineType", engineType);
      if (search) params.set("search", search);
      return fetch(`/api/vehicles?${params}`).then(r => r.json());
    },
  });

  const handleSearch = () => setSearch(searchInput);

  const featuredVehicles = vehicles?.filter(v => v.featured) ?? [];
  const regularVehicles = vehicles?.filter(v => !v.featured) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              <MapPin size={12} className="mr-1" /> Nha Trang, Vietnam
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
              Rent the Perfect
              <span className="text-primary block">Ride in Nha Trang</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Explore Vietnam's most beautiful coastal city on two wheels. From electric VinFast bikes to classic scooters — find your perfect rental from local owners.
            </p>

            {/* Search bar */}
            <div className="flex gap-2 max-w-xl" data-testid="search-container">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search bikes, brands, models..."
                  className="pl-10 h-12 bg-background border-border"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  data-testid="input-search"
                />
              </div>
              <Button className="h-12 px-6" onClick={handleSearch} data-testid="button-search">
                Search
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-primary" />
                <span>Verified owners</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-primary" />
                <span>Instant booking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-primary" />
                <span>Best prices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <SlidersHorizontal size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Filter:</span>
            </div>

            {/* Type filters */}
            <div className="flex gap-1.5" data-testid="filter-type">
              {vehicleTypes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setVehicleType(t.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    vehicleType === t.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  data-testid={`filter-type-${t.value || "all"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-border flex-shrink-0" />

            {/* Engine type filters */}
            <div className="flex gap-1.5" data-testid="filter-engine">
              {engineTypes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setEngineType(t.value)}
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    engineType === t.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  data-testid={`filter-engine-${t.value || "all"}`}
                >
                  {t.value === "electric" && <Zap size={10} />}
                  {t.value === "gasoline" && <Fuel size={10} />}
                  {t.label}
                </button>
              ))}
            </div>

            {(vehicleType || engineType || search) && (
              <button
                onClick={() => { setVehicleType(""); setEngineType(""); setSearch(""); setSearchInput(""); }}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 whitespace-nowrap transition-all flex-shrink-0"
                data-testid="button-clear-filters"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {isLoading ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-border">
                  <Skeleton className="aspect-[16/10] w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !vehicles || vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center" data-testid="empty-state">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bike size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Try adjusting your filters or search terms to find available vehicles.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => { setVehicleType(""); setEngineType(""); setSearch(""); setSearchInput(""); }}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featuredVehicles.length > 0 && !vehicleType && !engineType && !search && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Star size={18} className="text-amber-500" fill="currentColor" />
                      Featured Listings
                    </h2>
                    <p className="text-sm text-muted-foreground">Top picks from verified owners</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featuredVehicles.map(v => (
                    <VehicleCard key={v.id} vehicle={v} />
                  ))}
                </div>
              </section>
            )}

            {/* All listings */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold">
                    {vehicleType || engineType || search ? "Search Results" : "All Vehicles"}
                  </h2>
                  <p className="text-sm text-muted-foreground">{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} available</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" data-testid="vehicles-grid">
                {(vehicleType || engineType || search ? vehicles : regularVehicles).map(v => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Bike className="text-primary-foreground" size={14} />
              </div>
              <div>
                <span className="font-bold">RentMyBike<span className="text-primary">.vn</span></span>
                <p className="text-xs text-muted-foreground">P2P Vehicle Rental — Nha Trang, Vietnam</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              © 2025 RentMyBike. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
