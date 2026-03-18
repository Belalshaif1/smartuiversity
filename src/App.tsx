import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import React, { Suspense } from "react";

// Eager load critical pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages
const Universities = React.lazy(() => import("./pages/Universities"));
const Services = React.lazy(() => import("./pages/Services"));
const Jobs = React.lazy(() => import("./pages/Jobs"));
const Research = React.lazy(() => import("./pages/Research"));
const Graduates = React.lazy(() => import("./pages/Graduates"));
const Fees = React.lazy(() => import("./pages/Fees"));
const Announcements = React.lazy(() => import("./pages/Announcements"));
const Chat = React.lazy(() => import("./pages/Chat"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Profile = React.lazy(() => import("./pages/Profile"));
const More = React.lazy(() => import("./pages/More"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

const LazyFallback = () => (
  <div className="flex items-center justify-center py-20 text-muted-foreground">
    <div className="animate-pulse">جاري التحميل...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppLayout>
                <Suspense fallback={<LazyFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/universities" element={<Universities />} />
                    <Route path="/universities/:universityId" element={<Universities />} />
                    <Route path="/universities/:universityId/colleges/:collegeId" element={<Universities />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/research" element={<Research />} />
                    <Route path="/graduates" element={<Graduates />} />
                    <Route path="/fees" element={<Fees />} />
                    <Route path="/announcements" element={<Announcements />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/more" element={<More />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
