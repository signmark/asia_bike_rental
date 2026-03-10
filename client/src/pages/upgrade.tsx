import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Star, Check, ArrowLeft, Upload, CreditCard, Clock,
  Loader2, Zap, Shield, TrendingUp, Bike, AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import type { Payment } from "@shared/schema";

const features = {
  free: [
    "1 vehicle listing",
    "Basic profile",
    "Receive booking requests",
    "Standard search placement",
  ],
  business: [
    "Unlimited vehicle listings",
    "Priority search placement",
    "Featured listing badge",
    "Verified Business badge",
    "Revenue analytics",
    "Priority support",
  ],
};

export default function Upgrade() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!user) { navigate("/login"); return null; }

  const { data: myPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments/my"],
  });

  const hasPendingPayment = myPayments?.some(p => p.status === "pending");

  const submitMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/payments", {
      amount: "29.00",
      plan: "business",
      proofImage: proofUrl || undefined,
      notes: notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/my"] });
      setSubmitted(true);
      toast({ title: "Payment submitted!", description: "Admin will review your payment within 24 hours." });
    },
    onError: () => {
      toast({ title: "Submission failed", variant: "destructive" });
    },
  });

  if (user.subscriptionStatus === "business") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-card-border text-center">
          <CardContent className="p-8">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Star className="text-amber-500" size={24} fill="currentColor" />
            </div>
            <h2 className="text-xl font-bold mb-2">You're on Business Plan</h2>
            <p className="text-muted-foreground text-sm mb-6">
              You already have full access to all Business features.
            </p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="-ml-2 mb-6" data-testid="button-back">
            <ArrowLeft size={14} className="mr-1.5" /> Back
          </Button>
        </Link>

        <div className="text-center mb-10">
          <Badge className="mb-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            <Star size={12} className="mr-1" fill="currentColor" /> Business Plan
          </Badge>
          <h1 className="text-3xl font-bold mb-3">Unlock Your Full Potential</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            List unlimited vehicles, get featured placement, and grow your rental business in Nha Trang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Free Plan */}
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Free</CardTitle>
              <CardDescription>Get started for free</CardDescription>
              <div className="text-3xl font-bold mt-2">$0<span className="text-base font-normal text-muted-foreground">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {features.free.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Check size={10} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Business Plan */}
          <Card className="border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-400" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Business</CardTitle>
                <Badge className="bg-primary text-primary-foreground text-xs">Popular</Badge>
              </div>
              <CardDescription>Everything you need to grow</CardDescription>
              <div className="text-3xl font-bold mt-2">$29<span className="text-base font-normal text-muted-foreground">/month</span></div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {features.business.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-primary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: <Bike size={20} />, title: "Unlimited Listings", desc: "List all your vehicles" },
            { icon: <Zap size={20} />, title: "Priority Placement", desc: "Appear first in search" },
            { icon: <Shield size={20} />, title: "Verified Badge", desc: "Build trust with renters" },
            { icon: <TrendingUp size={20} />, title: "Revenue Analytics", desc: "Track your earnings" },
            { icon: <Star size={20} />, title: "Featured Listings", desc: "Stand out on the marketplace" },
            { icon: <Clock size={20} />, title: "Fast Approval", desc: "Listings approved within 2h" },
          ].map((b, i) => (
            <Card key={i} className="border-card-border">
              <CardContent className="p-4 text-center">
                <div className="text-primary mb-2">{b.icon}</div>
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment section */}
        {submitted || hasPendingPayment ? (
          <Card className="border-card-border max-w-lg mx-auto" data-testid="payment-pending">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                <Clock className="text-amber-500" size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">Payment Under Review</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your payment proof has been submitted. Our team will review it within 24 hours and activate your Business plan.
              </p>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-card-border max-w-lg mx-auto" data-testid="payment-form">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard size={18} className="text-primary" /> Complete Payment
              </CardTitle>
              <CardDescription>
                Transfer $29 USD and upload your payment proof to activate Business plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bank info */}
              <div className="p-4 bg-muted rounded-xl space-y-2 text-sm">
                <p className="font-semibold">Transfer Details:</p>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <span>Bank:</span><span className="font-medium text-foreground">Vietcombank</span>
                  <span>Account Name:</span><span className="font-medium text-foreground">RENT MY BIKE VN</span>
                  <span>Account #:</span><span className="font-medium text-foreground">1234 5678 9012</span>
                  <span>Amount:</span><span className="font-bold text-primary">$29 USD / 700,000 VND</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <AlertCircle size={14} className="text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Include your username <strong>{user.username}</strong> in the transfer notes for faster processing.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Payment Proof URL (screenshot link)</Label>
                <Input
                  type="url"
                  placeholder="https://... (link to your payment screenshot)"
                  value={proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  data-testid="input-proof-url"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Transfer reference number, date of transfer..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  data-testid="input-payment-notes"
                />
              </div>

              <Button
                className="w-full"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                data-testid="button-submit-payment"
              >
                {submitMutation.isPending ? (
                  <><Loader2 size={14} className="mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><Upload size={14} className="mr-2" /> Submit Payment Proof</>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Our team will review your payment within 24 hours and activate your account.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
