import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { Globe } from 'lucide-react';
import { getCountryCode } from '../utils/countries';

export interface CountryFlagProps {
  country?: string | null;
  className?: string;
  title?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  country,
  className = '',
  title,
}) => {
  const code = getCountryCode(country ?? undefined);
  const displayTitle = title || country || 'País';
  const defaultClasses = 'w-5 h-3.5 object-cover rounded-xs border border-zinc-200/80 shadow-xs';
  const flagClasses = className ? `${defaultClasses} ${className}` : defaultClasses;

  if (code && code in Flags) {
    const FlagComponent = (Flags as Record<string, React.ComponentType<{ className?: string; title?: string }>>)[code];
    if (FlagComponent) {
      return (
        <FlagComponent
          className={`inline-block flex-shrink-0 overflow-hidden ${flagClasses}`}
          title={displayTitle}
        />
      );
    }
  }

  return (
    <span
      className={`inline-flex items-center justify-center bg-zinc-100/90 text-zinc-400 flex-shrink-0 overflow-hidden ${flagClasses}`}
      title={displayTitle}
    >
      <Globe className="w-2.5 h-2.5 text-zinc-400" />
    </span>
  );
};

export default CountryFlag;
