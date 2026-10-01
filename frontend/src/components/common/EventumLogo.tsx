import eventumLogo from '@/assets/eventum-logo.png';

interface EventumLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-10',
  md: 'h-14',
  lg: 'h-20',
};

export function EventumLogo({ className = '', size = 'md' }: EventumLogoProps) {
  return (
    <img
      src={eventumLogo}
      alt="Eventum"
      className={`${sizeMap[size]} w-auto object-contain ${className}`}
    />
  );
}
