import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { mapCampaignContentRow } from "@/lib/campaigns/mappers";
import CampaignContentEditor from "./CampaignContentEditor";

interface ContentEditorPageProps {
  params: { id: string; contentId: string };
}

export default async function CampaignContentEditorPage({
  params,
}: ContentEditorPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const { data: postRow, error } = await supabase
    .from("campaign_posts")
    .select(
      `
      *,
      campaigns!inner ( id, user_id, name, persona_id )
    `
    )
    .eq("id", params.contentId)
    .eq("campaign_id", params.id)
    .eq("campaigns.user_id", user.id)
    .single();

  if (error || !postRow) {
    return notFound();
  }

  const mapped = mapCampaignContentRow(postRow);

  return (
    <CampaignContentEditor
      campaignId={params.id}
      campaignName={postRow.campaigns?.name ?? "Campaign"}
      content={mapped}
      personaId={mapped.persona_id}
    />
  );
}


