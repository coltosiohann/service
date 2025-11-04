import { redirect } from 'next/navigation';

export default async function Home() {
  // Authentication disabled - redirect directly to dashboard
  redirect('/dashboard');
}

