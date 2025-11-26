"use client";

import { useEffect, useState, useTransition } from "react";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface CampaignPostsPanelProps {
  campaignId: string;
  personaId: string;
}

interface CampaignPost {
  id: string;
  campaign_id: string;
  persona_id: string;
  persona_social_account_id: string;
  platform_id: string;
  status: string;
  scheduled_for: string | null;
  posted_at: string | null;
  content_json: { text: string };
  created_at: string;
  error_message: string | null;
}

interface PersonaSocialAccountOption {
  id: string;
  platform_id: string;
  account_handle: string | null;
  status: string;
  access_token_expires_at: string | null;
}

const POST_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
];

export function CampaignPostsPanel({
  campaignId,
  personaId,
}: CampaignPostsPanelProps) {
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [accounts, setAccounts] = useState<PersonaSocialAccountOption[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    persona_social_account_id: "",
    status: "draft",
    scheduled_for: "",
    content_text: "",
  });
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    status: "draft",
    scheduled_for: "",
    content_text: "",
  });

  useEffect(() => {
    async function loadPosts() {
      setLoadingPosts(true);
      try {
        const response = await fetch(
          `/api/campaign-posts?campaignId=${campaignId}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("Failed to load campaign posts");
        }
        const data = (await response.json()) as CampaignPost[];
        setPosts(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unexpected error loading posts."
        );
      } finally {
        setLoadingPosts(false);
      }
    }

    loadPosts();
  }, [campaignId]);

  useEffect(() => {
    async function loadAccounts() {
      setLoadingAccounts(true);
      try {
        const response = await fetch(
          `/api/social/persona-accounts?personaId=${personaId}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("Failed to load persona accounts");
        }
        const data = (await response.json()) as PersonaSocialAccountOption[];
        setAccounts(data);
        if (data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            persona_social_account_id: data[0].id,
          }));
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unexpected error loading accounts."
        );
      } finally {
        setLoadingAccounts(false);
      }
    }

    loadAccounts();
  }, [personaId]);

  const handleFormChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, status: event.target.value }));
  };

  const handleAccountChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      persona_social_account_id: event.target.value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!formData.persona_social_account_id) {
      setFormError("Select a persona social account.");
      return;
    }

    if (!formData.content_text) {
      setFormError("Content text is required.");
      return;
    }

    startTransition(async () => {
      try {
        const selectedAccount = accounts.find(
          (account) => account.id === formData.persona_social_account_id
        );
        if (!selectedAccount) {
          throw new Error("Selected account not found");
        }

        const payload = {
          campaign_id: campaignId,
          persona_id: personaId,
          persona_social_account_id: selectedAccount.id,
          platform_id: selectedAccount.platform_id,
          status: formData.status,
          scheduled_for: formData.scheduled_for || null,
          content_json: {
            text: formData.content_text,
          },
        };

        const response = await fetch("/api/campaign-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            payload?.error || "Failed to create campaign post."
          );
        }

        const created = (await response.json()) as CampaignPost;
        setPosts((prev) => [created, ...prev]);
        setFormData((prev) => ({
          ...prev,
          content_text: "",
          scheduled_for: "",
          status: "draft",
        }));
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "Unexpected error creating campaign post."
        );
      }
    });
  };

  const startEditingPost = (post: CampaignPost) => {
    setEditingPostId(post.id);
    setEditData({
      status: post.status,
      scheduled_for: post.scheduled_for
        ? new Date(post.scheduled_for).toISOString().slice(0, 16)
        : "",
      content_text: post.content_json?.text ?? "",
    });
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditData({
      status: "draft",
      scheduled_for: "",
      content_text: "",
    });
    setFormError(null);
  };

  const handleEditChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const saveEditedPost = async (postId: string) => {
    setFormError(null);

    if (!editData.content_text) {
      setFormError("Content text is required.");
      return;
    }

    try {
      const payload = {
        id: postId,
        status: editData.status,
        scheduled_for: editData.scheduled_for || null,
        content_json: {
          text: editData.content_text,
        },
      };

      const response = await fetch("/api/campaign-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to update campaign post.");
      }

      const updatedPost = (await response.json()) as CampaignPost;
      setPosts((prev) =>
        prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
      );
      cancelEditing();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unexpected error updating campaign post."
      );
    }
  };

  const updatePostStatus = async (postId: string, nextStatus: string) => {
    setFormError(null);
    try {
      const response = await fetch("/api/campaign-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: postId,
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error || "Failed to update campaign post status."
        );
      }

      const updatedPost = (await response.json()) as CampaignPost;
      setPosts((prev) =>
        prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unexpected error updating status."
      );
    }
  };

  const renderStatusActions = (post: CampaignPost) => {
    if (post.status === "draft") {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePostStatus(post.id, "scheduled")}
          >
            Mark Scheduled
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => updatePostStatus(post.id, "published")}
          >
            Mark Published
          </Button>
        </div>
      );
    }

    if (post.status === "scheduled") {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePostStatus(post.id, "draft")}
          >
            Back to Draft
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => updatePostStatus(post.id, "published")}
          >
            Mark Published
          </Button>
        </div>
      );
    }

    if (post.status === "published") {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => updatePostStatus(post.id, "draft")}
        >
          Revert to Draft
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Campaign Post</CardTitle>
          <CardDescription>
            Draft and schedule posts for the selected campaign and persona.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="persona_social_account_id">
                  Target account
                </Label>
                <select
                  id="persona_social_account_id"
                  name="persona_social_account_id"
                  value={formData.persona_social_account_id}
                  onChange={handleAccountChange}
                  disabled={loadingAccounts || accounts.length === 0}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {accounts.length === 0 && (
                    <option value="">No connected accounts</option>
                  )}
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.platform_id} • {account.account_handle ?? "N/A"} (
                      {account.status})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleStatusChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {POST_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_for">Schedule</Label>
                <Input
                  id="scheduled_for"
                  name="scheduled_for"
                  type="datetime-local"
                  value={formData.scheduled_for}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content_text">Content</Label>
              <Textarea
                id="content_text"
                name="content_text"
                value={formData.content_text}
                onChange={handleFormChange}
                rows={4}
                placeholder="Write your post copy..."
                required
              />
            </div>
            <div className="flex justify-between items-center">
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
              <Button
                type="submit"
                disabled={
                  isPending || accounts.length === 0 || !formData.content_text
                }
              >
                {isPending ? "Creating..." : "Create post"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Posts</CardTitle>
          <CardDescription>
            Track drafts, scheduled posts, and publishing results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPosts ? (
            <p className="text-sm text-muted-foreground">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No campaign posts yet.
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge variant="outline" className="capitalize">
                      {post.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Created{" "}
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {post.content_json?.text}
                  </p>
                  <div className="text-xs text-muted-foreground flex gap-4 flex-wrap">
                    <span>Platform: {post.platform_id}</span>
                    {post.scheduled_for && (
                      <span>
                        Scheduled{" "}
                        {new Date(post.scheduled_for).toLocaleString()}
                      </span>
                    )}
                    {post.posted_at && (
                      <span>
                        Posted {new Date(post.posted_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {post.error_message && (
                    <p className="text-xs text-destructive">
                      Error: {post.error_message}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 justify-between items-center pt-2 border-t">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startEditingPost(post)}
                      >
                        Edit
                      </Button>
                      {renderStatusActions(post)}
                    </div>
                  </div>
                  {editingPostId === post.id && (
                    <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-content-${post.id}`}>
                          Content
                        </Label>
                        <Textarea
                          id={`edit-content-${post.id}`}
                          name="content_text"
                          value={editData.content_text}
                          onChange={handleEditChange}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-status-${post.id}`}>
                            Status
                          </Label>
                          <select
                            id={`edit-status-${post.id}`}
                            name="status"
                            value={editData.status}
                            onChange={handleEditChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            {POST_STATUSES.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-scheduled-${post.id}`}>
                            Scheduled time
                          </Label>
                          <Input
                            id={`edit-scheduled-${post.id}`}
                            name="scheduled_for"
                            type="datetime-local"
                            value={editData.scheduled_for}
                            onChange={handleEditChange}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={cancelEditing}>
                          Cancel
                        </Button>
                        <Button onClick={() => saveEditedPost(post.id)}>
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

