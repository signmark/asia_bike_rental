import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Bike, Zap, Fuel, Loader2, Plus, X, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import type { VehicleWithOwner } from "@shared/schema";

const formSchema = insertVehicleSchema.extend({
  pricePerDay: z.string().min(1, "Price is required"),
  images: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddVehicle() {
  const [, params] = useRoute("/edit-vehicle/:id");
  const isEditing = !!params?.id;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrl, setImageUrl] = useState("");
  const [limitError, setLimitError] = useState(false);

  if (!user) { navigate("/login"); return null; }

  const { data: existing } = useQuery<VehicleWithOwner>({
    queryKey: ["/api/vehicles", params?.id],
    queryFn: () => fetch(`/api/vehicles/${params?.id}`).then(r => r.json()),
    enabled: isEditing,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: existing?.title ?? "",
      description: existing?.description ?? "",
      type: existing?.type ?? "bike",
      engineType: existing?.engineType ?? "electric",
      brand: existing?.brand ?? "",
      model: existing?.model ?? "",
      year: existing?.year ?? new Date().getFullYear(),
      color: existing?.color ?? "",
      seats: existing?.seats ?? 2,
      pricePerDay: existing?.pricePerDay?.toString() ?? "",
      pricePerWeek: existing?.pricePerWeek?.toString() ?? "",
      pricePerMonth: existing?.pricePerMonth?.toString() ?? "",
      location: existing?.location ?? "Nha Trang",
      images: existing?.images ?? [],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest("POST", "/api/vehicles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Vehicle submitted!", description: "Your listing is pending review." });
      navigate("/dashboard");
    },
    onError: async (err: any) => {
      const msg = err?.message || "";
      if (msg.includes("LIMIT_REACHED")) {
        setLimitError(true);
        return;
      }
      toast({ title: "Failed to save", description: "Please try again.", variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest("PATCH", `/api/vehicles/${params?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Vehicle updated!" });
      navigate("/dashboard");
    },
    onError: () => {
      toast({ title: "Update failed", variant: "destructive" });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isEditing) editMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const images = form.watch("images") ?? [];

  const addImage = () => {
    if (imageUrl.trim()) {
      form.setValue("images", [...images, imageUrl.trim()]);
      setImageUrl("");
    }
  };

  const removeImage = (i: number) => {
    form.setValue("images", images.filter((_, idx) => idx !== i));
  };

  const isPending = createMutation.isPending || editMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-6 -ml-2" data-testid="button-back">
          <ArrowLeft size={14} className="mr-1.5" /> Back to dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{isEditing ? "Edit Vehicle" : "List Your Vehicle"}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isEditing ? "Update your listing details" : "Fill in the details to start earning from your vehicle"}
          </p>
        </div>

        {limitError && (
          <Alert className="mb-6 border-amber-300 bg-amber-50 dark:bg-amber-900/20" data-testid="alert-limit">
            <AlertTriangle size={14} className="text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              You've reached the free plan limit (1 vehicle).{" "}
              <Link href="/upgrade">
                <a className="font-semibold underline">Upgrade to Business</a>
              </Link>{" "}
              to list unlimited vehicles.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic info */}
            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bike size={16} className="text-primary" /> Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Title <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. VinFast Klara S - Clean Electric Scooter" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bike">Motorbike</SelectItem>
                            <SelectItem value="scooter">Scooter</SelectItem>
                            <SelectItem value="car">Car</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="engineType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Engine <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-engine">
                              <SelectValue placeholder="Select engine" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="electric">
                              <div className="flex items-center gap-1.5"><Zap size={12} className="text-emerald-500" /> Electric</div>
                            </SelectItem>
                            <SelectItem value="gasoline">
                              <div className="flex items-center gap-1.5"><Fuel size={12} className="text-orange-500" /> Petrol</div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="VinFast, Honda..." {...field} data-testid="input-brand" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Klara S, Wave..." {...field} data-testid="input-model" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" min={2000} max={2025} {...field} onChange={e => field.onChange(Number(e.target.value))} data-testid="input-year" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="White, Black..." {...field} value={field.value ?? ""} data-testid="input-color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seats <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={8} {...field} onChange={e => field.onChange(Number(e.target.value))} data-testid="input-seats" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your vehicle, condition, what's included..."
                          rows={4}
                          {...field}
                          value={field.value ?? ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Pricing & Location */}
            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pricing & Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="pricePerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price/Day (USD) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input type="number" min="1" step="0.5" className="pl-6" {...field} data-testid="input-price-day" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pricePerWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price/Week</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input type="number" min="1" step="1" className="pl-6" {...field} value={field.value ?? ""} data-testid="input-price-week" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pricePerMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price/Month</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input type="number" min="1" step="1" className="pl-6" {...field} value={field.value ?? ""} data-testid="input-price-month" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Nha Trang Center, Vinpearl Area..." {...field} data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Photos */}
            <Card className="border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="Paste image URL..."
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addImage())}
                    data-testid="input-image-url"
                  />
                  <Button type="button" variant="outline" onClick={addImage} data-testid="button-add-image">
                    <Plus size={14} />
                  </Button>
                </div>

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative group w-20 h-14 rounded-lg overflow-hidden border border-border" data-testid={`image-preview-${i}`}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Add image URLs from the web. First image will be the cover.</p>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-vehicle">
                {isPending ? (
                  <><Loader2 size={14} className="mr-2 animate-spin" /> {isEditing ? "Saving..." : "Submitting..."}</>
                ) : (
                  isEditing ? "Save Changes" : "Submit for Review"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
