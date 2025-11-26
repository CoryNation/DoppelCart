"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function SocialOAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function processCallback() {
      const platform = searchParams.get("platform");
      const personaId = searchParams.get("personaId");
      const state = searchParams.get("state");
      const oauthStatus = searchParams.get("oauth_status");
      const oauthError = searchParams.get("oauth_error");
      const oauthErrorDescription = searchParams.get("oauth_error_description");

      if (!platform || !personaId || !state) {
        window.opener?.postMessage(
          {
            type: "social-oauth-result",
            status: "error",
            error: "Missing OAuth parameters in callback.",
          },
          window.location.origin
        );
        window.close();
        return;
      }

      if (oauthStatus === "error") {
        window.opener?.postMessage(
          {
            type: "social-oauth-result",
            status: "error",
            error:
              oauthErrorDescription ||
              oauthError ||
              "Provider returned an error during authorization.",
          },
          window.location.origin
        );
        window.close();
        return;
      }

      try {
        const response = await fetch(
          `/api/social/oauth/${platform}/exchange`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ state }),
          }
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            payload?.error ||
              "Failed to finalize OAuth exchange. Please try again."
          );
        }

        window.opener?.postMessage(
          { type: "social-oauth-result", status: "success" },
          window.location.origin
        );
        window.close();
      } catch (error) {
        window.opener?.postMessage(
          {
            type: "social-oauth-result",
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "Unexpected error completing OAuth exchange.",
          },
          window.location.origin
        );
        window.close();
      }
    }

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-4 text-center px-4">
      <div className="animate-pulse">
        <p className="text-base font-medium text-foreground">
          Completing connection…
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          You can close this window once the process finishes.
        </p>
      </div>
    </div>
  );
}

export default function SocialOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex flex-col items-center justify-center space-y-4 text-center px-4">
          <div className="animate-pulse">
            <p className="text-base font-medium text-foreground">
              Loading…
            </p>
          </div>
        </div>
      }
    >
      <SocialOAuthCallbackContent />
    </Suspense>
  );
}

