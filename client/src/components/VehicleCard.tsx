import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Zap, Fuel, MapPin, Star, Users } from "lucide-react";
import type { VehicleWithOwner } from "@shared/schema";

interface VehicleCardProps {
  vehicle: VehicleWithOwner;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const image = vehicle.images?.[0] || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80";

  return (
    <Link href={`/vehicle/${vehicle.id}`}>
      <a data-testid={`card-vehicle-${vehicle.id}`}>
        <Card className="overflow-hidden group cursor-pointer border border-card-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-card">
          {/* Image */}
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            <img
              src={image}
              alt={vehicle.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {vehicle.featured && (
                <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-xs px-2 py-0.5 shadow-sm">
                  <Star size={10} className="mr-1" fill="white" /> Featured
                </Badge>
              )}
              <Badge
                className={`text-xs px-2 py-0.5 shadow-sm ${
                  vehicle.engineType === "electric"
                    ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                    : "bg-orange-500 hover:bg-orange-500 text-white"
                }`}
              >
                {vehicle.engineType === "electric" ? (
                  <><Zap size={10} className="mr-1" />Electric</>
                ) : (
                  <><Fuel size={10} className="mr-1" />Petrol</>
                )}
              </Badge>
            </div>

            {/* Price pill */}
            <div className="absolute bottom-3 right-3">
              <div className="bg-background/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
                <span className="text-base font-bold text-foreground">${vehicle.pricePerDay}</span>
                <span className="text-xs text-muted-foreground">/day</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-vehicle-title-${vehicle.id}`}>
                {vehicle.title}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="font-medium text-foreground">{vehicle.brand} {vehicle.model}</span>
              {vehicle.year && <span>·</span>}
              {vehicle.year && <span>{vehicle.year}</span>}
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Users size={10} /> {vehicle.seats}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={11} />
                <span className="truncate max-w-[120px]">{vehicle.location}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {vehicle.owner?.displayName || vehicle.owner?.username}
              </div>
            </div>
          </div>
        </Card>
      </a>
    </Link>
  );
}
