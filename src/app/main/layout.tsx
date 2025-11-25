/**
 * Main Page Layout - Force Dynamic Rendering
 * 
 * This layout ensures the entire /main route is rendered dynamically
 * to avoid SSR issues with client-side authentication hooks
 */

export const dynamic = 'force-dynamic';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
