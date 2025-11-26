"use client";

import { useEffect, useState } from "react";
import Card, { CardContent } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonaSocialAccount, SocialPlatform } from "@/types/social";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface SocialConnectionsSectionProps {
  personaId: string;
}

interface FetchState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

export function SocialConnectionsSection({
  personaId,
}: SocialConnectionsSectionProps) {
  const [platformState, setPlatformState] = useState<
    FetchState<SocialPlatform[]>
  >({
    data: [],
    isLoading: true,
    error: null,
  });
  const [accountState, setAccountState] = useState<
    FetchState<PersonaSocialAccount[]>
  >({
    data: [],
    isLoading: true,
    error: null,
  });
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(
    null
  );
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setPlatformState((prev) => ({ ...prev, isLoading: true, error: null }));
      setAccountState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const [platformRes, accountRes] = await Promise.all([
          fetch("/api/social/platforms", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`/api/social/persona-accounts?personaId=${personaId}`, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        if (!platformRes.ok) {
          const payload = await platformRes.json().catch(() => null);
          throw new Error(
            payload?.error || "Failed to load social platforms. Try again."
          );
        }

        if (!accountRes.ok) {
          const payload = await accountRes.json().catch(() => null);
          throw new Error(
            payload?.error ||
              "Failed to load persona social accounts. Try again."
          );
        }

        const [platforms, accounts] = (await Promise.all([
          platformRes.json(),
          accountRes.json(),
        ])) as [SocialPlatform[], PersonaSocialAccount[]];

        if (isCancelled) {
          return;
        }

        setPlatformState({
          data: platforms,
          isLoading: false,
          error: null,
        });

        setAccountState({
          data: accounts,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Unexpected error loading social data.";
        setPlatformState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        setAccountState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [personaId, refreshNonce]);

  const isLoading = platformState.isLoading || accountState.isLoading;
  const error = platformState.error || accountState.error;
  const platforms = platformState.data;
  const socialAccounts = accountState.data;

  const handleRetry = () => {
    setRefreshNonce((prev) => prev + 1);
  };

  const handleRedditConnect = async () => {
    if (connectingPlatform === "reddit") {
      return;
    }

    setConnectError(null);
    setConnectingPlatform("reddit");

    try {
      const params = new URLSearchParams({
        personaId,
        redirectTo: window.location.href,
      });

      const response = await fetch(
        `/api/social/oauth/reddit/start?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error ||
            "Failed to initiate Reddit OAuth. Please try again."
        );
      }

      const data = await response.json();
      if (!data?.url) {
        throw new Error("Missing Reddit authorization URL.");
      }

      window.location.href = data.url;
    } catch (error) {
      setConnectingPlatform(null);
      setConnectError(
        error instanceof Error
          ? error.message
          : "Unexpected error starting Reddit OAuth."
      );
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Social Connections</h2>
        <p className="text-sm text-muted-foreground">
          Connect this persona to social media accounts. OAuth connections open
          in a secure popup; complete the provider flow to return to this page.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Need help?{" "}
          <Link
            href="/docs/social-connections"
            className="underline underline-offset-4"
          >
            View integration guide
          </Link>
        </p>
      </div>

      {connectError && (
        <Card className="mb-4 border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {connectError}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[0, 1].map((key) => (
            <Card key={key}>
              <CardContent className="p-6 animate-pulse space-y-2">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-3 w-1/4 bg-muted rounded" />
                <div className="h-10 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={handleRetry}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : platforms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No platforms configured yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {platforms.map((platform) => {
            const account = socialAccounts.find(
              (acc) => acc.platform_id === platform.id
            );
            const isReddit = platform.id === "reddit";
            const redditConnected =
              isReddit && account?.status === "connected";
            const redditUsername =
              account?.provider_username ||
              account?.account_handle ||
              account?.display_name ||
              null;
            const redditHandle = redditUsername
              ? redditUsername.startsWith("u/")
                ? redditUsername
                : `u/${redditUsername}`
              : null;
            const lastRefreshed =
              account?.last_refreshed_at || account?.last_token_refresh_at;

            return (
              <Card key={platform.id}>
                <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{platform.display_name}</h3>
                      <Badge
                        variant={
                          platform.status === "active" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {platform.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                      {platform.supports_text && <span>Text</span>}
                      {platform.supports_images && <span>Images</span>}
                      {platform.supports_comments && <span>Comments</span>}
                      {platform.supports_dms && <span>DMs</span>}
                    </div>
                    {isReddit ? (
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          {redditConnected
                            ? "Reddit connection is active."
                            : "Connect Reddit to schedule posts and sync engagement."}
                        </p>
                        {redditConnected && redditHandle && (
                          <Badge variant="outline" className="w-fit">
                            Connected as {redditHandle}
                          </Badge>
                        )}
                        {redditConnected && account?.profile_url && (
                          <p>
                            <a
                              href={account.profile_url}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-4"
                            >
                              View profile
                            </a>
                          </p>
                        )}
                        {redditConnected && (
                          <div className="text-xs space-y-1">
                            <p>
                              Status:{" "}
                              <span className="font-medium">
                                {account?.status}
                              </span>
                            </p>
                            {account?.access_token_expires_at && (
                              <p>
                                Access renews{" "}
                                {formatDistanceToNow(
                                  new Date(account.access_token_expires_at),
                                  { addSuffix: true }
                                )}
                              </p>
                            )}
                            {lastRefreshed && (
                              <p>
                                Last refreshed{" "}
                                {formatDistanceToNow(new Date(lastRefreshed), {
                                  addSuffix: true,
                                })}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        OAuth integration coming soon.
                      </p>
                    )}
                  </div>

                  <div className="text-right min-w-[180px]">
                    {isReddit ? (
                      redditConnected ? (
                        <div className="flex flex-col items-end gap-2">
                          <Button variant="outline" size="sm" disabled>
                            Disconnect (coming soon)
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="default"
                          onClick={handleRedditConnect}
                          disabled={connectingPlatform === "reddit"}
                        >
                          {connectingPlatform === "reddit"
                            ? "Connecting..."
                            : "Connect Reddit"}
                        </Button>
                      )
                    ) : (
                      <Button variant="secondary" disabled>
                        Connect (Coming soon)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

