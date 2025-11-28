import { redirect } from 'next/navigation';

// Redirect old route to new authenticated route
export default async function NewAgentPage({
  searchParams,
}: {
  searchParams: Promise<{ fromResearchId?: string }>;
}) {
  const { fromResearchId } = await searchParams;
  
  // Redirect to new route, preserving query params
  const params = new URLSearchParams();
  if (fromResearchId) {
    params.set('fromResearchId', fromResearchId);
  }
  
  redirect(`/personas/new${params.toString() ? `?${params.toString()}` : ''}`);
}
