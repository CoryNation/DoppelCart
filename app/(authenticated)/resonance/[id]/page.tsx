import ResonanceDetailClient from "./ResonanceDetailClient";

interface ResonanceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResonanceDetailPage({
  params,
}: ResonanceDetailPageProps) {
  const { id } = await params;
  return <ResonanceDetailClient researchId={id} />;
}
