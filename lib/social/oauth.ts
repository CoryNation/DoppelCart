import { createHash, randomBytes, randomUUID } from "crypto";

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generatePkcePair() {
  const codeVerifier = base64UrlEncode(randomBytes(64));
  const codeChallenge = base64UrlEncode(
    createHash("sha256").update(codeVerifier).digest()
  );

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256" as const,
  };
}

export function generateOAuthState() {
  return randomUUID();
}

export function enforceRedirectUri(redirectUri: string) {
  let parsed: URL;
  try {
    parsed = new URL(redirectUri);
  } catch {
    throw new Error("Invalid redirect URI");
  }

  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;

  if (allowedOrigin) {
    let allowed: URL;
    try {
      allowed = new URL(allowedOrigin);
    } catch {
      throw new Error("Invalid NEXT_PUBLIC_APP_URL configuration");
    }

    if (parsed.origin !== allowed.origin) {
      throw new Error("Redirect URI must share the same origin as the app URL");
    }
  }

  return parsed.toString();
}

function buildEnvKey(platformId: string, suffix: string) {
  return `SOCIAL_${platformId.replace(/[^a-z0-9]/gi, "_").toUpperCase()}_${suffix}`;
}

export function resolvePlatformClientId(platformId: string) {
  const envKey = buildEnvKey(platformId, "CLIENT_ID");
  const clientId = process.env[envKey];

  if (!clientId) {
    throw new Error(
      `Missing OAuth client ID environment variable ${envKey} for platform ${platformId}`
    );
  }

  return { clientId, envKey };
}

export function resolvePlatformClientSecret(platformId: string) {
  const envKey = buildEnvKey(platformId, "CLIENT_SECRET");
  const clientSecret = process.env[envKey];

  if (!clientSecret) {
    throw new Error(
      `Missing OAuth client secret environment variable ${envKey} for platform ${platformId}`
    );
  }

  return { clientSecret, envKey };
}

