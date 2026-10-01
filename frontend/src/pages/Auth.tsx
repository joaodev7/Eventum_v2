import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { EventumLogo } from '@/components/common/EventumLogo';
import heroImage from '@/assets/hero-eventum.jpg';
import { SeoHead } from '@/components/common/SeoHead';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message || 'Não foi possível criar sua conta. Verifique os dados e tente novamente.');
        } else {
          toast.success('Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro.');
          navigate('/admin');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
        } else {
          toast.success('Bem-vindo de volta!');
          navigate('/admin');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <SeoHead
        title={isSignUp ? 'Criar Conta — Eventum' : 'Entrar — Eventum'}
        description="Acesse o painel do Eventum para gerenciar seus eventos, convites e lista de presentes."
        noIndex={true}
      />
      {/* Left — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-end p-12">
        <img
          src={heroImage}
          alt="Evento elegante"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-foreground/20" />
        <div className="relative z-10 max-w-md">
          <EventumLogo size="lg" className="mb-8 [&_span]:text-primary-foreground" />
          <p className="font-serif text-3xl text-primary-foreground/90 leading-snug mb-4">
            Gestão profissional de eventos com a sofisticação que seus clientes merecem.
          </p>
          <p className="text-primary-foreground/60 text-sm">
            Plataforma completa para cerimonialistas e organizadores de eventos.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/">
              <EventumLogo size="lg" />
            </Link>
          </div>

          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0">
              <CardTitle className="text-3xl font-serif">
                {isSignUp ? 'Criar Conta' : 'Acessar Painel'}
              </CardTitle>
              <CardDescription className="text-base">
                {isSignUp
                  ? 'Preencha seus dados para começar a usar o Eventum'
                  : 'Entre com suas credenciais para continuar'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      required={isSignUp}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {isSignUp ? 'Criar Conta' : 'Entrar'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isSignUp
                    ? 'Já possui uma conta? Entrar'
                    : 'Ainda não tem conta? Criar conta'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link
                  to="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Voltar ao site
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
