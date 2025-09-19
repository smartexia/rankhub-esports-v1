import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import { Login } from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Championships from "./pages/Championships";
import Championship from "./pages/Championship";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import Matches from "./pages/Matches";
// MatchPrints page removed - functionality integrated into MatchResultsManager
import BattleRoyaleProcessor from "./pages/BattleRoyaleProcessor";

import SuperAdminPanel from "./pages/SuperAdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
             <Route path="/" element={<Index />} />
             <Route path="/login" element={<Login />} />
             <Route path="/dashboard" element={
               <ProtectedRoute>
                 <Dashboard />
               </ProtectedRoute>
             } />
             <Route path="/championships" element={
               <ProtectedRoute>
                 <Championships />
               </ProtectedRoute>
             } />
             <Route path="/championship/:id" element={
               <ProtectedRoute>
                 <Championship />
               </ProtectedRoute>
             } />
             <Route path="/teams" element={
               <ProtectedRoute>
                 <Teams />
               </ProtectedRoute>
             } />
             <Route path="/players" element={
               <ProtectedRoute>
                 <Players />
               </ProtectedRoute>
             } />
             <Route path="/matches" element={
               <ProtectedRoute>
                 <Matches />
               </ProtectedRoute>
             } />
             {/* MatchPrints route removed - functionality integrated into championship management */}
             <Route path="/battle-royale-processor/:matchId" element={
               <ProtectedRoute>
                 <BattleRoyaleProcessor />
               </ProtectedRoute>
             } />
             <Route path="/super-admin" element={
               <ProtectedRoute>
                 <SuperAdminPanel />
               </ProtectedRoute>
             } />
             {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
             <Route path="*" element={<NotFound />} />
           </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
