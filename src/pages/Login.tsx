import { useState } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad2, Trophy, Users, Target, Zap, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Login() {
  const { user, signIn, signUp, loading } = useAuth();
  const location = useLocation();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se já estiver logado, redirecionar para o dashboard
  if (user) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await signIn(loginData.email, loginData.password);
    setIsSubmitting(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await signUp(signupData.email, signupData.password, { name: signupData.name });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">RankHub</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Hero Content */}
            <div className="text-white space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Gerencie seus
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Torneios</span>
                </h1>
                <p className="text-xl text-blue-100 leading-relaxed">
                  Plataforma profissional de gerenciamento de torneios para Call of Duty Mobile Battle Royale. Crie, gerencie e acompanhe campeonatos com processamento automatizado de resultados.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-blue-300" />
                  </div>
                  <span className="text-blue-100">Torneios Profissionais</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-300" />
                  </div>
                  <span className="text-blue-100">Processamento Rápido</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-300" />
                  </div>
                  <span className="text-blue-100">Gestão de Equipes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-orange-300" />
                  </div>
                  <span className="text-blue-100">Análise Detalhada</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex space-x-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">500+</div>
                  <div className="text-blue-200 text-sm">Torneios Realizados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">10k+</div>
                  <div className="text-blue-200 text-sm">Jogadores Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">50+</div>
                  <div className="text-blue-200 text-sm">Organizadores</div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex justify-center">
              <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white">Bem-vindo de volta</CardTitle>
                  <CardDescription className="text-blue-100">
                    Faça login ou crie sua conta para continuar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/10">
                      <TabsTrigger value="login" className="text-white data-[state=active]:bg-white/20">
                        Login
                      </TabsTrigger>
                      <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/20">
                        Cadastro
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login" className="space-y-4 mt-6">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-white">Senha</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                          disabled={isSubmitting || loading}
                        >
                          {isSubmitting ? 'Entrando...' : 'Entrar'}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="signup" className="space-y-4 mt-6">
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name" className="text-white">Nome</Label>
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Seu nome"
                            value={signupData.name}
                            onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-white">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={signupData.email}
                            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-white">Senha</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={signupData.password}
                            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                          disabled={isSubmitting || loading}
                        >
                          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="text-center">
                  <p className="text-sm text-blue-200">
                    Ao continuar, você concorda com nossos{' '}
                    <Link to="/terms" className="text-blue-300 hover:text-blue-100 underline">
                      Termos de Uso
                    </Link>
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="p-6 text-center">
          <div className="flex justify-center space-x-6 text-blue-200 text-sm">
            <Link to="/about" className="hover:text-white transition-colors">
              Sobre
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              Contato
            </Link>
            <Link to="/help" className="hover:text-white transition-colors">
              Ajuda
            </Link>
          </div>
          <div className="mt-4 text-blue-300 text-sm">
            © 2024 RankHub. Todos os direitos reservados.
          </div>
        </footer>
      </div>
    </div>
  );
}