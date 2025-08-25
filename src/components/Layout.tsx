import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CreateChampionshipDialog } from '@/components/CreateChampionshipDialog';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Trophy,
  Users,
  Target,
  Crown,
  Gamepad2,
  LogOut,
  User,
  Home,
  Settings,
  HelpCircle,
  BarChart3,
  Shield
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Layout = ({ children, title, description }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!error && data?.role === 'super_admin') {
          setIsSuperAdmin(true);
        }
      } catch (error) {
        console.error('Erro ao verificar role do usuário:', error);
      }
    };

    checkSuperAdmin();
  }, [user?.id]);

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
    { id: "championships", label: "Campeonatos", icon: Trophy, href: "/championships" },
    { id: "teams", label: "Gerenciar Equipes", icon: Users, href: "/teams" },
    { id: "players", label: "Jogadores", icon: User, href: "/players" },
    { id: "matches", label: "Partidas", icon: Target, href: "/matches" },
    { id: "rankings", label: "Rankings", icon: Crown },
    { id: "stats", label: "Estatísticas Detalhadas", icon: BarChart3 },
    { id: "settings", label: "Configurações", icon: Settings },
    { id: "help", label: "Ajuda/Suporte", icon: HelpCircle }
  ];

  // Adicionar item Super Admin se o usuário for super admin
  if (isSuperAdmin) {
    sidebarItems.splice(-2, 0, { 
      id: "super-admin", 
      label: "Painel Super Admin", 
      icon: Shield,
      href: "/super-admin"
    });
  }

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar Fixo */}
        <aside className="w-64 bg-gradient-dark border-r border-border/50 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Gamepad2 className="h-8 w-8 text-primary glow-red" />
              <h1 className="text-xl font-orbitron font-bold text-glow">
                RankHub
              </h1>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.name || user?.email} />
                <AvatarFallback className="bg-primary/10 text-primary font-orbitron">
                  {user?.user_metadata?.name ? getUserInitials(user.user_metadata.name) : 
                   user?.email ? getUserInitials(user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-orbitron truncate">
                  {user?.user_metadata?.name || 'Gamer'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <button
                        onClick={() => navigate(item.href!)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-rajdhani ${
                          isActive(item.href)
                            ? 'bg-primary/20 text-primary border border-primary/30 glow-red'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          // Funcionalidade futura para itens sem href
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-rajdhani text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Create Championship Button */}
          <div className="p-4 border-t border-border/50">
            <CreateChampionshipDialog 
              trigger={
                <Button className="w-full gradient-primary glow-red font-rajdhani font-semibold">
                  <Trophy className="h-5 w-5 mr-2" />
                  Criar Novo Campeonato
                </Button>
              }
            />
          </div>

          {/* Logout */}
          <div className="p-4">
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="w-full justify-start text-muted-foreground hover:text-destructive font-rajdhani"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Área Principal */}
        <main className="flex-1 overflow-auto">
          {/* Header */}
          {(title || description) && (
            <header className="bg-gradient-dark border-b border-border/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  {title && (
                    <h2 className="text-2xl font-orbitron font-bold text-glow">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-muted-foreground font-rajdhani">
                      {description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Última atualização: {new Date().toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </header>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Layout;