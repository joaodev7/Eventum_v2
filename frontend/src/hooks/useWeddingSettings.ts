import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';
import { Event } from '@/lib/types';

export function useWeddingSettings() {
  return useQuery({
    queryKey: ['wedding-settings'],
    queryFn: async () => {
      try {
        const events = await eventsApi.getEvents();
        const active = events.find(e => e.status === 'active') || events[0];
        if (active) {
          return {
            id: active.id,
            couple_names: active.eventName,
            wedding_date: active.eventDate || null,
            venue_name: active.venueName || null,
            venue_address: active.venueAddress || null,
            welcome_message: active.welcomeMessage || null,
            hero_image_url: active.heroImageUrl || null,
            gallery_images: active.galleryImages || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return null;
      } catch {
        return null;
      }
    },
  });
}

export function useUpdateWeddingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<Event>) => {
      const events = await eventsApi.getEvents();
      const active = events.find(e => e.status === 'active') || events[0];
      if (!active) throw new Error('No active event found');

      return await eventsApi.updateEvent(active.id, {
        eventName: settings.event_name,
        eventDate: settings.event_date || undefined,
        venueName: settings.venue_name || undefined,
        venueAddress: settings.venue_address || undefined,
        welcomeMessage: settings.welcome_message || undefined,
        heroImageUrl: settings.hero_image_url || undefined,
        galleryImages: settings.gallery_images,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wedding-settings'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
