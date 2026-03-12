import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useLang } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bike, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    fetch(`/api/auth/reset-password/${token}`)
      .then(r => r.json())
      .then(d => setTokenValid(d.valid === true))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError(t.resetPassword.passNoMatch); return; }
    if (password.length < 6) { setError(t.resetPassword.passShort); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.resetPassword.error);
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordMatch = confirm && password === confirm;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <a className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Bike className="text-primary-foreground" size={20} />
              </div>
              <span className="font-bold text-2xl">
                RentMyBike<span className="text-primary">.vn</span>
              </span>
            </a>
          </Link>
        </div>

        <Card className="border border-card-border shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold">{t.resetPassword.title}</CardTitle>
            <CardDescription>{t.resetPassword.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {tokenValid === null ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : tokenValid === false ? (
              <div className="text-center py-6">
                <AlertCircle className="mx-auto mb-3 text-destructive" size={40} />
                <p className="font-semibold mb-1">{t.resetPassword.invalidTitle}</p>
                <p className="text-sm text-muted-foreground mb-4">{t.resetPassword.invalidDesc}</p>
                <Link href="/forgot-password">
                  <Button variant="outline" size="sm" data-testid="button-request-new">{t.resetPassword.requestNew}</Button>
                </Link>
              </div>
            ) : done ? (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={40} />
                <p className="font-semibold mb-1">{t.resetPassword.successTitle}</p>
                <p className="text-sm text-muted-foreground">{t.resetPassword.successDesc}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" data-testid="alert-error">
                    <AlertCircle size={14} />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">{t.resetPassword.newPassword}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t.resetPassword.passwordPlaceholder}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                    data-testid="input-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">{t.resetPassword.confirmPassword}</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type="password"
                      placeholder={t.resetPassword.confirmPlaceholder}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      className={`h-11 pr-10 ${confirm ? (passwordMatch ? "border-emerald-500 focus-visible:ring-emerald-500" : "border-destructive focus-visible:ring-destructive") : ""}`}
                      data-testid="input-confirm"
                    />
                    {confirm && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {passwordMatch
                          ? <CheckCircle2 size={16} className="text-emerald-500" />
                          : <AlertCircle size={16} className="text-destructive" />}
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading} data-testid="button-submit-reset">
                  {isLoading
                    ? <><Loader2 size={16} className="mr-2 animate-spin" /> {t.resetPassword.saving}</>
                    : t.resetPassword.saveBtn}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
