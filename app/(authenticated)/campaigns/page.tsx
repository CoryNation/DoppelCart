import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import Link from "next/link";
import { notFound } from "next/navigation";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Campaign {
  id: string;
  persona_id: string;
  name: string;
  status: string;
  objective: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Persona {
  id: string;
  display_name: string;
}

export default async function CampaignsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const { data: personas } = await supabase
    .from("personas")
    .select("id, display_name")
    .eq("user_id", user.id);

  const personaMap =
    personas?.reduce<Record<string, Persona>>((acc, persona) => {
      acc[persona.id] = persona as Persona;
      return acc;
    }, {}) ?? {};

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const campaignList = (campaigns || []) as Campaign[];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Plan and track persona-led campaigns across social platforms.
          </p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">New Campaign</Link>
        </Button>
      </div>

      {campaignList.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No campaigns yet</CardTitle>
            <CardDescription>
              Create your first campaign to coordinate content across channels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/campaigns/new">Create campaign</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaignList.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <CardTitle>{campaign.name}</CardTitle>
                  <Badge variant="outline" className="capitalize">
                    {campaign.status}
                  </Badge>
                </div>
                <CardDescription>
                  Persona: {personaMap[campaign.persona_id]?.display_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign.objective && (
                  <p className="text-sm text-muted-foreground">
                    {campaign.objective}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Start:{" "}
                    {campaign.start_date
                      ? new Date(campaign.start_date).toLocaleDateString()
                      : "TBD"}
                  </span>
                  <span>
                    End:{" "}
                    {campaign.end_date
                      ? new Date(campaign.end_date).toLocaleDateString()
                      : "TBD"}
                  </span>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" asChild>
                    <Link href={`/campaigns/${campaign.id}`}>View campaign</Link>
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

