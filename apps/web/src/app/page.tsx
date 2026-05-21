import { redirect } from 'next/navigation';

/** The app root redirects to the admin event-types dashboard. */
export default function Home() {
  redirect('/event-types');
}
