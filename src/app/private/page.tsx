import { redirect } from 'next/navigation';

/** Backward-compatible redirect for previously shared private-flight links. */
export default function LegacyPrivateFlightsPage() {
  redirect('/private-helicopter-flights-hawaii');
}
