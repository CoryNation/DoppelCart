import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment configuration.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

Deno.serve(async () => {
  const nowIso = new Date().toISOString();

  try {
    const { data: scheduledPosts, error } = await supabase
      .from("campaign_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", nowIso);

    if (error) {
      console.error("Failed to fetch scheduled posts", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch scheduled posts" }),
        { status: 500 }
      );
    }

    const processed: string[] = [];

    for (const post of scheduledPosts ?? []) {
      const workflowState = {
        ...(post.workflow_state ?? {}),
        scheduler: {
          ...(post.workflow_state?.scheduler ?? {}),
          lastSimulatedRun: nowIso,
        },
      };

      const { error: updateError } = await supabase
        .from("campaign_posts")
        .update({
          status: "published",
          posted_at: nowIso,
          workflow_state: workflowState,
        })
        .eq("id", post.id);

      if (updateError) {
        console.error("Failed to update scheduled post", {
          id: post.id,
          error: updateError,
        });
        continue;
      }

      processed.push(post.id);
      console.log(
        `Simulated postScheduler publish for campaign_post ${post.id} targeting platform ${post.platform_id}`
      );
    }

    return new Response(
      JSON.stringify({ processed, count: processed.length }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("postScheduler failed", error);
    return new Response(JSON.stringify({ error: "Scheduler failure" }), {
      status: 500,
    });
  }
});


