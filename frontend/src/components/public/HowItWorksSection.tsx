import { CalendarPlus, Users, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: CalendarPlus,
    title: 'Crie seu evento',
    description:
      'Configure o evento em minutos — nome, data, local, identidade visual. Tudo personalizado para refletir sua marca.',
  },
  {
    icon: Users,
    title: 'Gerencie com precisão',
    description:
      'Convites digitais, confirmações em tempo real, mesas organizadas e lista de presentes integrada.',
  },
  {
    icon: Sparkles,
    title: 'Entregue uma experiência única',
    description:
      'Seus convidados acessam uma página exclusiva do evento — elegante, responsiva e personalizada.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-widest uppercase text-accent-foreground/70 mb-3">
            Processo
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">
            Como funciona
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <step.icon className="w-7 h-7 text-secondary-foreground group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="font-serif text-2xl mb-3 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
