export interface RegionOption {
  value: string;
  label: string;
}

export const REGIONS: RegionOption[] = [
  { value: 'NA', label: 'North America' },
  { value: 'ME', label: 'Middle East' },
  { value: 'EUW', label: 'Europe West' },
  { value: 'EUNE', label: 'Europe Nordic & East' },
  { value: 'OCE', label: 'Oceania' },
  { value: 'KR', label: 'Korea' },
  { value: 'JP', label: 'Japan' },
  { value: 'BR', label: 'Brazil' },
  { value: 'LAS', label: 'LAS' },
  { value: 'LAN', label: 'LAN' },
  { value: 'RU', label: 'Russia' },
  { value: 'TR', label: 'Türkiye' },
  { value: 'SEA', label: 'Southeast Asia' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'PBE', label: 'Public Beta' }
];
