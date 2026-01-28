/**
 * Location data (countries + cities)
 */

export type CountryCode = 'GN' | 'TR' | 'FR' | 'US' | 'SN';

export interface CountryOption {
  code: CountryCode;
  nameKey: string;
  flag: string;
}

export interface CityOption {
  key: string;
  name: string;
}

export const countries: CountryOption[] = [
  { code: 'GN', nameKey: 'countries.GN', flag: '🇬🇳' },
  { code: 'TR', nameKey: 'countries.TR', flag: '🇹🇷' },
  { code: 'FR', nameKey: 'countries.FR', flag: '🇫🇷' },
  { code: 'US', nameKey: 'countries.US', flag: '🇺🇸' },
  { code: 'SN', nameKey: 'countries.SN', flag: '🇸🇳' },
];

export const citiesByCountry: Record<CountryCode, CityOption[]> = {
  GN: [{ key: 'conakry', name: 'Conakry' }],
  TR: [{ key: 'istanbul', name: 'Istanbul' }],
  FR: [{ key: 'paris', name: 'Paris' }],
  US: [{ key: 'newYork', name: 'New York' }],
  SN: [{ key: 'dakar', name: 'Dakar' }],
};

export const countryFlags = countries.reduce((acc, country) => {
  acc[country.code] = country.flag;
  return acc;
}, {} as Record<string, string>);

export const getCitiesForCountry = (code: CountryCode) => citiesByCountry[code] || [];
