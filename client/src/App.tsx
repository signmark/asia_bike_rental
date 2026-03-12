import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/language";
import { Navbar } from "@/components/Navbar";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import VehiclePage from "@/pages/vehicle";
import Dashboard from "@/pages/dashboard";
import AddVehicle from "@/pages/add-vehicle";
import Upgrade from "@/pages/upgrade";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/vehicle/:id" component={VehiclePage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/add-vehicle" component={AddVehicle} />
      <Route path="/edit-vehicle/:id" component={AddVehicle} />
      <Route path="/upgrade" component={Upgrade} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Router />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppLayout />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
