import { Car, Sparkles, Wind } from 'lucide-react';

/** Base packages – customer picks one */
export const SERVICE_OPTIONS = [
  {
    id: 'regular',
    label: 'Regular package',
    price: 60,
    Icon: Car,
    description: 'Exterior wash, interior vacuum, window cleaning, tire shine.',
  },
  {
    id: 'full',
    label: 'Full detail',
    price: 120,
    Icon: Sparkles,
    description: 'Exterior wash, interior vacuum, wax and polish, full interior shampoo, tire shine.',
  },
];

/** Add-ons – can select with either package */
export const ADD_ON_OPTIONS = [
  {
    id: 'odor_removal',
    label: 'Odor removal',
    price: 20,
    description: 'Deep odor elimination. Add to any package.',
    Icon: Wind,
  },
];

/** For display on home/services pages */
export const SERVICES_FOR_DISPLAY = [
  {
    name: 'Regular package',
    price: 60,
    desc: 'Exterior wash, interior vacuum, window cleaning, tire shine.',
    Icon: Car,
  },
  {
    name: 'Full detail',
    price: 120,
    desc: 'Exterior wash, interior vacuum, wax and polish, full interior shampoo, tire shine.',
    Icon: Sparkles,
  },
  {
    name: 'Odor removal',
    price: 20,
    desc: 'Add to any package. Deep odor elimination.',
    Icon: Wind,
  },
];
