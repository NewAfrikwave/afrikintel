import { redirect } from 'next/navigation'

// Root route redirects to landing page
// The dashboard is at /dashboard
export default function Home() {
  redirect('/landing')
}
