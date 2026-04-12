import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Shuttle from "./pages/Shuttle";
import Profile from "./pages/Profile";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminRides from "./pages/admin/AdminRides";
import AdminShuttles from "./pages/admin/AdminShuttles";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminUsers from "./pages/admin/AdminUsers";
import NotFound from "./pages/NotFound";

const Ride = lazy(() => import("./pages/Ride"));

const queryClient = new QueryClient();

function RouteFallback() {
  return <div className="min-h-screen bg-background" />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route
              path="/ride"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Ride />
                </Suspense>
              }
            />
            <Route path="/shuttle" element={<Shuttle />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="/auth" element={<Auth />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="rides" element={<AdminRides />} />
            <Route path="shuttles" element={<AdminShuttles />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
