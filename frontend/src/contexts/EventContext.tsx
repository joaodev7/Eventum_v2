import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { eventsApi } from '@/api/events';
import { publicApi } from '@/api/public';
import { PlanType } from '@/lib/types';

export type EventType = 'wedding' | 'birthday' | 'graduation' | 'party' | 'corporate' | 'other';
export type EventStatus = 'draft' | 'active' | 'archived';
export type EventRole = 'owner' | 'admin' | 'collaborator' | 'viewer';

export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  cardBackgroundColor?: string;
  fontFamily?: string;
  heroSubtitle?: string;
  giftsTitle?: string;
  giftsDescription?: string;
  giftsButtonText?: string;
  biblicalQuote?: string;
  biblicalQuoteReference?: string;
}

export interface EventSettings {
  trial_start?: string | null;
  trial_end?: string | null;
  showCountdown?: boolean;
  showGallery?: boolean;
  showGifts?: boolean;
  showLocation?: boolean;
}

export interface Event {
  id: string;
  slug: string;
  event_type: EventType;
  event_name: string;
  event_date: string | null;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_maps_link: string | null;
  hero_image_url: string | null;
  invite_image_url?: string | null;
  welcome_message: string | null;
  gallery_images: string[];
  theme_config: ThemeConfig;
  settings: EventSettings;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  plan: PlanType;
}

export interface EventUser {
  id: string;
  event_id: string;
  user_id: string;
  role: EventRole;
  created_at: string;
}

interface EventContextType {
  currentEvent: Event | null;
  userEvents: Event[];
  isLoadingEvents: boolean;
  setCurrentEvent: (event: Event | null) => void;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

function mapEventDtoToEvent(dto: any): Event {
  let themeConfig: ThemeConfig = {};
  if (dto.themeConfigJson) {
    try {
      themeConfig = JSON.parse(dto.themeConfigJson);
    } catch {
      themeConfig = {};
    }
  }

  let settings: EventSettings = {};
  if (dto.settingsJson) {
    try {
      settings = JSON.parse(dto.settingsJson);
    } catch {
      settings = {};
    }
  }

  return {
    id: dto.id,
    slug: dto.slug,
    event_type: (dto.eventType?.toLowerCase() || 'wedding') as EventType,
    event_name: dto.eventName,
    event_date: dto.eventDate || null,
    event_time: dto.eventTime || null,
    venue_name: dto.venueName || null,
    venue_address: dto.venueAddress || null,
    venue_maps_link: dto.venueMapsLink || null,
    hero_image_url: dto.heroImageUrl || null,
    invite_image_url: dto.inviteImageUrl || null,
    welcome_message: dto.welcomeMessage || null,
    gallery_images: dto.galleryImages || [],
    theme_config: themeConfig,
    settings: settings,
    status: (dto.status?.toLowerCase() || 'active') as EventStatus,
    created_by: null,
    created_at: dto.createdAt || new Date().toISOString(),
    updated_at: dto.updatedAt || new Date().toISOString(),
    plan: PlanType.Essentia,
  };
}

export function EventProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const fetchUserEvents = useCallback(async () => {
    if (!user?.id) {
      setUserEvents([]);
      setCurrentEvent(null);
      setIsLoadingEvents(false);
      return;
    }

    try {
      setIsLoadingEvents(true);
      const eventsData = await eventsApi.getEvents();
      const mapped = eventsData.map(mapEventDtoToEvent);
      setUserEvents(mapped);

      // Auto-select first event if none selected or if previous selection is not in list
      setCurrentEvent((prev) => {
        if (!prev && mapped.length > 0) return mapped[0];
        if (prev && mapped.some((e) => e.id === prev.id)) {
          return mapped.find((e) => e.id === prev.id) || mapped[0];
        }
        return mapped.length > 0 ? mapped[0] : null;
      });
    } catch (error) {
      console.error('Error fetching user events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserEvents();
  }, [fetchUserEvents]);

  const refreshEvents = async () => {
    await fetchUserEvents();
  };

  return (
    <EventContext.Provider value={{
      currentEvent,
      userEvents,
      isLoadingEvents,
      setCurrentEvent,
      refreshEvents,
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}

// Hook para obter evento por slug (acesso público)
export function useEventBySlug(slug: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const data = await publicApi.getPublicEvent(slug);
        if (data) {
          setEvent(mapEventDtoToEvent(data));
        } else {
          setEvent(null);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  return { event, isLoading, error };
}
