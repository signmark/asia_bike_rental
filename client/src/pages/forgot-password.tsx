import { useState } from "react";
import { Link } from "wouter";
import { useLang } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bike, Loader2, AlertCircle, Copy, CheckCircle2, ExternalLink } from "lucide-react";

export default function ForgotPassword() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.forgotPassword.error);
      if (data.token) {
        setResetLink(`${window.location.origin}/reset-password?token=${data.token}`);
      } else {
        // Email not found — show generic success to not expose existence
        setResetLink("not-found");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <CardTitle className="text-2xl font-bold">{t.forgotPassword.title}</CardTitle>
            <CardDescription>{t.forgotPassword.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {resetLink ? (
              resetLink === "not-found" ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={40} />
                  <p className="font-medium mb-1">{t.forgotPassword.sent}</p>
                  <p className="text-sm text-muted-foreground">{t.forgotPassword.sentDesc}</p>
                  <Link href="/login">
                    <a className="text-primary hover:underline text-sm mt-4 block">{t.forgotPassword.backToLogin}</a>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{t.forgotPassword.tokenReady}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">{t.forgotPassword.yourLink}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 bg-muted rounded-lg text-xs font-mono text-muted-foreground truncate border border-border" data-testid="text-reset-link">
                        {resetLink}
                      </div>
                      <Button variant="outline" size="sm" className="flex-shrink-0" onClick={copyLink} data-testid="button-copy-link">
                        {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </Button>
                      <a href={resetLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="flex-shrink-0" data-testid="button-open-link">
                          <ExternalLink size={14} />
                        </Button>
                      </a>
                    </div>
                  </div>

                  <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                    <AlertCircle size={14} className="text-amber-500" />
                    <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
                      {t.forgotPassword.noEmailNote}
                    </AlertDescription>
                  </Alert>

                  <p className="text-xs text-muted-foreground text-center">{t.forgotPassword.expiresIn}</p>

                  <Link href="/login">
                    <a className="text-primary hover:underline text-sm block text-center">{t.forgotPassword.backToLogin}</a>
                  </Link>
                </div>
              )
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" data-testid="alert-error">
                    <AlertCircle size={14} />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t.forgotPassword.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.forgotPassword.emailPlaceholder}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="h-11"
                    data-testid="input-email"
                  />
                </div>

                <Button type="submit" className="w-full h-11" disabled={isLoading} data-testid="button-submit-forgot">
                  {isLoading ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> {t.forgotPassword.sending}</>
                  ) : t.forgotPassword.sendBtn}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <Link href="/login">
                    <a className="text-primary hover:underline">{t.forgotPassword.backToLogin}</a>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
