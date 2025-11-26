import { SocialPlatformId } from "@/types/social";

export interface OAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
}

const redditOAuthConfig: OAuthConfig = {
  authorizeUrl: "https://www.reddit.com/api/v1/authorize",
  tokenUrl: "https://www.reddit.com/api/v1/access_token",
  scopes: ["identity", "submit", "read"],
};

export function getOAuthConfigForPlatform(
  platformId: SocialPlatformId | string
): OAuthConfig | null {
  switch (platformId) {
    case "reddit":
      return redditOAuthConfig;
    default:
      return null;
  }
}

export function getRedditClientCredentials() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Reddit OAuth is not configured. Missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET."
    );
  }

  return { clientId, clientSecret };
}

export function getRedditRedirectUri() {
  const explicitRedirect = process.env.REDDIT_REDIRECT_URI;
  if (explicitRedirect) {
    return explicitRedirect;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_APP_URL or REDDIT_REDIRECT_URI for Reddit OAuth redirect."
    );
  }

  const base = appUrl.replace(/\/+$/, "");
  return `${base}/api/social/oauth/reddit/callback`;
}


