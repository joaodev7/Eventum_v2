import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Carolina Mendes',
    role: 'Cerimonialista — São Paulo',
    quote:
      'O Eventum elevou o nível dos meus eventos. A área personalizada para cada cliente transmite profissionalismo e exclusividade que nenhuma outra ferramenta oferece.',
  },
  {
    name: 'Rafael Oliveira',
    role: 'Produtor de Eventos Corporativos',
    quote:
      'Gerenciar 400 convidados nunca foi tão simples. A organização por mesas e a confirmação em tempo real economizam horas do meu trabalho.',
  },
  {
    name: 'Beatriz Santos',
    role: 'Wedding Planner — Rio de Janeiro',
    quote:
      'Meus clientes ficam encantados com a página do evento. É como ter um site exclusivo para cada casamento, sem custo adicional.',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-sm font-medium tracking-widest uppercase text-accent-foreground/70 mb-3">
            Depoimentos
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground">
            Quem usa, recomenda
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <Card key={i} className="bg-card border-border/50 shadow-card hover:shadow-elegant transition-shadow duration-300">
              <CardContent className="pt-8 pb-6 px-6">
                <blockquote className="text-muted-foreground leading-relaxed mb-6 italic">
                  "{t.quote}"
                </blockquote>
                <div>
                  <p className="font-medium text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
