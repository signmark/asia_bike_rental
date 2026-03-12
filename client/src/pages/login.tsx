import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bike, Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || t.login.invalidCredentials);
    } finally {
      setIsLoading(false);
    }
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
            <CardTitle className="text-2xl font-bold">{t.login.welcome}</CardTitle>
            <CardDescription>{t.login.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" data-testid="alert-error">
                  <AlertCircle size={14} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">{t.login.username}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={t.login.usernamePlaceholder}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  data-testid="input-username"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.login.password}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.login.passwordPlaceholder}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                  className="h-11"
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading} data-testid="button-submit-login">
                {isLoading ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" /> {t.login.signingIn}</>
                ) : t.login.signIn}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t.login.noAccount}{" "}
                <Link href="/register">
                  <a className="text-primary hover:underline font-medium">{t.login.createOne}</a>
                </Link>
              </span>
              <Link href="/forgot-password">
                <a className="text-primary hover:underline" data-testid="link-forgot-password">{t.login.forgotPassword}</a>
              </Link>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-2">{t.login.demo}</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setUsername("admin"); setPassword("admin123"); }}
                  className="text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-left"
                  data-testid="button-demo-admin"
                >
                  <div className="font-medium">Admin</div>
                  <div className="text-muted-foreground">admin / admin123</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername("minh_vf"); setPassword("password123"); }}
                  className="text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-left"
                  data-testid="button-demo-owner"
                >
                  <div className="font-medium">Business Owner</div>
                  <div className="text-muted-foreground">minh_vf / password123</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
