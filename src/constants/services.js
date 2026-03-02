import { Car, CarFront, Layers } from 'lucide-react';

export const SERVICE_OPTIONS = [
  { id: 'exterior', label: 'Exterior', price: 60, Icon: Car },
  { id: 'interior', label: 'Interior', price: 80, Icon: CarFront },
  { id: 'both', label: 'Both', price: 140, Icon: Layers },
];

export const SERVICES_FOR_DISPLAY = [
  { name: 'Exterior', price: 60, desc: 'Wash, wax, wheels, windows.', Icon: Car },
  { name: 'Interior', price: 80, desc: 'Vacuum, wipe-down, conditioning.', Icon: CarFront },
  { name: 'Both', price: 140, desc: 'Full exterior and interior detail.', Icon: Layers },
];
