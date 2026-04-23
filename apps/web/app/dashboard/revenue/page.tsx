import { redirect } from 'next/navigation';

/**
 * The old /dashboard/revenue page was 100% hardcoded mock data (monthly
 * trend, per-track RPP, revenue sources). All of that data is now served
 * live by /dashboard/earnings, so point users there instead of maintaining
 * two parallel views. If a true "revenue analytics" page is built later
 * with e.g. per-track RPP or monthly time-series, it can live here.
 */
export default function RevenuePage() {
  redirect('/dashboard/earnings');
}
