import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Gift, Users, Grid3X3, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/public/Navbar';
import { HowItWorksSection } from '@/components/public/HowItWorksSection';
import { TestimonialsSection } from '@/components/public/TestimonialsSection';
import { EventumLogo } from '@/components/common/EventumLogo';
import heroImage from '@/assets/hero-eventum.jpg';

import { SeoHead } from '@/components/common/SeoHead';

const Index = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const landingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Eventum',
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Web',
    'description': 'Plataforma premium para gestão de casamentos e grandes eventos com RSVP inteligente, lista de presentes via PIX e organização de mesas.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'BRL',
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'reviewCount': '128'
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <SeoHead
        title="Eventum — Gestão de Casamentos, RSVP & Lista de Presentes"
        description="Plataforma premium para cerimonialistas e noivos. RSVP digital inteligente, repasse de presentes via PIX sem intermediários, mesas e financeiro ✓ Experimente!"
        keywords={['gestão de casamento', 'rsvp digital', 'organização de eventos', 'lista de presentes pix', 'cerimonial']}
        jsonLd={landingJsonLd}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 min-h-[90vh] flex items-center">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Evento elegante com decoração sofisticada"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/60 to-foreground/30" />
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-[0.3em] uppercase text-primary-foreground/70 mb-6">
              Plataforma de Gestão de Eventos
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-primary-foreground mb-8 leading-[1.1]">
              A sofisticação que seus eventos merecem
            </h1>
            <p className="text-primary-foreground/80 text-lg md:text-xl max-w-lg mb-10 leading-relaxed">
              Gerencie convites, confirmações, mesas e presentes com a elegância
              e a precisão que o seu trabalho exige.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-base px-8">
                <Link to="/auth">
                  Criar Minha Conta
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/pricing">
                  Conhecer os Planos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-medium tracking-widest uppercase text-accent-foreground/70 mb-3">
              Recursos
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">
              Tudo integrado em uma única plataforma
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card variant="elegant" className="text-center border-border/50">
              <CardHeader>
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-secondary flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle className="text-xl">Convites Digitais</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  Convites personalizados com link exclusivo para cada convidado e controle de visualização
                </CardDescription>
              </CardContent>
            </Card>

            <Card variant="elegant" className="text-center border-border/50">
              <CardHeader>
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-secondary flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle className="text-xl">Gestão de Convidados</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  Confirmações em tempo real, acompanhantes nomeados e reconfirmação próxima ao evento
                </CardDescription>
              </CardContent>
            </Card>

            <Card variant="elegant" className="text-center border-border/50">
              <CardHeader>
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-secondary flex items-center justify-center">
                  <Gift className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle className="text-xl">Lista de Presentes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  Presentes com pagamento integrado via PIX ou cartão, com controle total de reservas
                </CardDescription>
              </CardContent>
            </Card>

            <Card variant="elegant" className="text-center border-border/50">
              <CardHeader>
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-secondary flex items-center justify-center">
                  <Grid3X3 className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle className="text-xl">Organização de Mesas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  Distribua convidados em mesas com controle de capacidade e visualização intuitiva
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorksSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl md:text-5xl mb-6">
            Eleve o padrão dos seus eventos
          </h2>
          <p className="text-primary-foreground/80 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
            Junte-se a profissionais que escolhem o Eventum para entregar
            experiências memoráveis aos seus clientes.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-base px-8">
            <Link to="/auth">
              Criar Minha Conta <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <EventumLogo size="sm" />
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">
                Planos
              </Link>
              <a href="mailto:contato@eventum.com.br" className="hover:text-foreground transition-colors">
                Contato
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Eventum. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Index;
