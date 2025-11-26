import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  mapCampaignContentRow,
  mapCampaignRow,
} from "@/lib/campaigns/mappers";
import type {
  Campaign,
  CampaignContent,
  CampaignGenerationJob,
} from "@/types/campaign";
import CampaignDetailClient from "./CampaignDetailClient";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const { data: campaignRow, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (campaignError || !campaignRow) {
    return notFound();
  }

  const [personaResult, postsResult, jobResult] = await Promise.all([
    supabase
      .from("personas")
      .select("display_name")
      .eq("id", campaignRow.persona_id)
      .single(),
    supabase
      .from("campaign_posts")
      .select("*")
    .eq("campaign_id", campaignRow.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaign_generation_jobs")
      .select("*")
      .eq("campaign_id", campaignRow.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const campaign: Campaign = mapCampaignRow(campaignRow);
  const contentItems: CampaignContent[] =
    postsResult.data?.map(mapCampaignContentRow) ?? [];
  const latestJob: CampaignGenerationJob | null = jobResult.data
    ? {
        id: jobResult.data.id,
        campaign_id: jobResult.data.campaign_id,
        input_prompt: jobResult.data.input_prompt,
        status: jobResult.data.status,
        error_message: jobResult.data.error_message ?? null,
        result_json: jobResult.data.result_json ?? {},
        created_at: jobResult.data.created_at,
        updated_at: jobResult.data.updated_at,
      }
    : null;

  return (
    <CampaignDetailClient
      campaign={campaign}
      personaName={personaResult.data?.display_name ?? "Persona"}
      initialContent={contentItems}
      initialJob={latestJob}
    />
  );
}

