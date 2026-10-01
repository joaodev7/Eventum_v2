import { Link } from 'react-router-dom';
import { Event } from '@/contexts/EventContext';

interface FooterProps {
  event?: Event;
}

export function Footer({ event }: FooterProps) {
  return (
    <footer className="py-12 bg-[hsl(var(--event-foreground,var(--foreground)))] text-[hsl(var(--event-primary-foreground,var(--primary-foreground)))]">
      <div className="container mx-auto px-4 text-center">
        <p className="font-serif text-2xl mb-4">Obrigado por fazer parte desta história</p>
        <div className="mt-6 pt-6 border-t border-[hsl(var(--event-primary-foreground,var(--primary-foreground)))]/10">
          <Link
            to="/admin"
            className="text-[10px] tracking-widest uppercase text-[hsl(var(--event-primary-foreground,var(--primary-foreground)))]/30 hover:text-[hsl(var(--event-primary-foreground,var(--primary-foreground)))]/50 transition-colors"
          >
            Powered by Eventum
          </Link>
        </div>
      </div>
    </footer>
  );
}
