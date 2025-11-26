import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import {
  mapCampaignRow,
  type DbCampaignRow,
} from "@/lib/campaigns/mappers";
import type { Campaign } from "@/types/campaign";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CampaignListItem extends Campaign {
  content_count: number;
  persona_name?: string;
}

export default async function CampaignsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const [{ data: personas }, { data, error }] = await Promise.all([
    supabase
      .from("personas")
      .select("id, display_name")
      .eq("user_id", user.id),
    supabase
      .from("campaigns")
      .select(
        `
        *,
        campaign_posts(count)
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    console.error("Failed to load campaigns", error);
    throw new Error("Unable to load campaigns");
  }

  const personaMap =
    personas?.reduce<Record<string, string>>((acc, persona) => {
      acc[persona.id] = persona.display_name;
      return acc;
    }, {}) ?? {};

  type CampaignRowWithCount = DbCampaignRow & {
    campaign_posts?: { count?: number }[];
  };

  const campaigns: CampaignListItem[] =
    ((data as CampaignRowWithCount[] | null) ?? []).map((row) => {
      const mapped = mapCampaignRow(row);
      const countEntry = row.campaign_posts?.[0];
      return {
        ...mapped,
        content_count: countEntry?.count ?? 0,
        persona_name: personaMap[mapped.persona_id],
      };
    });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Grid of every persona-led campaign across your platforms.
          </p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">New Campaign</Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Create your first campaign</CardTitle>
            <CardDescription>
              Spin up a targeted initiative, then let AI draft channel-ready
              content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/campaigns/new">Start a campaign</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="h-full">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xl">{campaign.name}</CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {campaign.status}
                  </Badge>
                </div>
                <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">Persona:</span>
                  <span>{campaign.persona_name ?? "Unknown"}</span>
                </CardDescription>
                {campaign.description && (
                  <p className="text-sm text-muted-foreground">
                    {campaign.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {campaign.target_platforms.length === 0 ? (
                    <Badge variant="secondary">No platforms selected</Badge>
                  ) : (
                    campaign.target_platforms.map((platform) => (
                      <Badge key={platform} variant="secondary">
                        {platform}
                      </Badge>
                    ))
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{campaign.content_count} content items</span>
                  <span>
                    Updated{" "}
                    {new Date(campaign.updated_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" asChild>
                    <Link href={`/campaigns/${campaign.id}`}>Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

