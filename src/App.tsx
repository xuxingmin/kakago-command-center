import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CommandLayout } from "@/components/layout/CommandLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Merchants from "./pages/Merchants";
import Supply from "./pages/Supply";
import SupplyBOM from "./pages/SupplyBOM";
import SupplySKU from "./pages/SupplySKU";
import SupplyDashboard from "./pages/SupplyDashboard";
import SupplyRequest from "./pages/SupplyRequest";
import SupplyPush from "./pages/SupplyPush";
import Finance from "./pages/Finance";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/dashboard"
            element={
              <CommandLayout>
                <Dashboard />
              </CommandLayout>
            }
          />
          <Route
            path="/users"
            element={
              <CommandLayout>
                <Users />
              </CommandLayout>
            }
          />
          <Route
            path="/merchants"
            element={
              <CommandLayout>
                <Merchants />
              </CommandLayout>
            }
          />
          <Route
            path="/supply"
            element={
              <CommandLayout>
                <Supply />
              </CommandLayout>
            }
          />
          <Route
            path="/supply/bom"
            element={
              <CommandLayout>
                <SupplyBOM />
              </CommandLayout>
            }
          />
          <Route
            path="/supply/sku"
            element={
              <CommandLayout>
                <SupplySKU />
              </CommandLayout>
            }
          />
          <Route
            path="/supply/dashboard"
            element={
              <CommandLayout>
                <SupplyDashboard />
              </CommandLayout>
            }
          />
          <Route
            path="/supply/request"
            element={
              <CommandLayout>
                <SupplyRequest />
              </CommandLayout>
            }
          />
          <Route
            path="/supply/push"
            element={
              <CommandLayout>
                <SupplyPush />
              </CommandLayout>
            }
          />
          <Route
            path="/finance"
            element={
              <CommandLayout>
                <Finance />
              </CommandLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <CommandLayout>
                <SettingsPage />
              </CommandLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
