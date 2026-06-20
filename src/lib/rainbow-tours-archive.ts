/**
 * ARCHIVED — Rainbow Helicopters tours (disabled from live booking flow Jun 2026).
 * Kept for reference / pending-vendors / future re-enable.
 */
import type { Tour } from './tours';

export const rainbowToursArchive: Tour[] = [
  {
    id: 'rainbow-oahu-doors-off',
    name: 'Oahu Doors-Off Adventure',
    operator: 'rainbow',
    island: 'Oahu',
    pricePerPerson: 249,
    duration: '45 minutes',
    description: 'Doors-off adventure tour of Oahu',
    doorsOff: true,
  },
  {
    id: 'rainbow-oahu-scenic',
    name: 'Oahu Scenic Tour',
    operator: 'rainbow',
    island: 'Oahu',
    pricePerPerson: 229,
    duration: '40 minutes',
    description: 'Scenic doors-on tour',
    doorsOff: false,
  },
  {
    id: 'rainbow-oahu-complete',
    name: 'Complete Oahu Experience',
    operator: 'rainbow',
    island: 'Oahu',
    pricePerPerson: 299,
    duration: '60 minutes',
    description: 'Complete island tour with doors-off option',
    doorsOff: true,
  },
];