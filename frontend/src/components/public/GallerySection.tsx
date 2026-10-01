import { Heart } from 'lucide-react';
import { Event } from '@/contexts/EventContext';

interface GallerySectionProps {
  event?: Event;
}

export function GallerySection({ event }: GallerySectionProps) {
  const galleryImages = event?.gallery_images;

  // Don't render if no gallery images
  if (!galleryImages || galleryImages.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-[hsl(var(--event-background,var(--background)))]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Heart className="w-8 h-8 mx-auto text-[hsl(var(--event-accent,var(--dusty-rose)))] mb-4" fill="currentColor" />
          <h2 className="text-3xl md:text-4xl font-serif mb-4 text-[hsl(var(--event-foreground,var(--foreground)))]">Nossa História</h2>
          <p className="text-[hsl(var(--event-muted-foreground,var(--muted-foreground)))] max-w-xl mx-auto">
            Momentos especiais que compartilhamos juntos
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryImages.map((url, index) => (
            <div
              key={index}
              className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-elegant transition-shadow duration-300 ${
                index === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <img
                src={url}
                alt={`Momento ${index + 1}`}
                className={`w-full object-cover hover:scale-105 transition-transform duration-500 ${
                  index === 0 ? 'h-64 md:h-full' : 'h-48 md:h-56'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--event-foreground,var(--foreground)))]/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
