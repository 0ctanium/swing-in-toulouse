import { env } from "@/env";

export type VercelDnsRecord = {
  type: string;
  name: string;
  value: string;
  reason?: string;
};

export type VercelDomainStatus = {
  domain: string;
  verified: boolean;
  records: VercelDnsRecord[];
};

type VercelDomainResponse = {
  name?: string;
  domain?: string;
  verified?: boolean;
  verification?: Array<{
    type?: string;
    domain?: string;
    value?: string;
    reason?: string;
  }>;
};

function requireVercelConfig() {
  if (!env.VERCEL_TOKEN || !env.VERCEL_PROJECT_ID) {
    throw new Error(
      "Configuration Vercel manquante (VERCEL_TOKEN et VERCEL_PROJECT_ID).",
    );
  }

  return {
    token: env.VERCEL_TOKEN,
    projectId: env.VERCEL_PROJECT_ID,
    teamId: env.VERCEL_TEAM_ID,
  };
}

function projectDomainUrl(domain?: string) {
  const { projectId, teamId } = requireVercelConfig();
  const path = domain
    ? `/v10/projects/${projectId}/domains/${encodeURIComponent(domain)}`
    : `/v10/projects/${projectId}/domains`;
  const url = new URL(path, "https://api.vercel.com");

  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }

  return url;
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function readVercelJson(response: Response) {
  const body = (await response.json().catch(() => null)) as
    | (VercelDomainResponse & { error?: { message?: string } })
    | null;

  if (!response.ok) {
    throw new Error(
      body?.error?.message ?? "L'appel à l'API Vercel a échoué.",
    );
  }

  return body ?? {};
}

function toDomainStatus(
  domain: string,
  response: VercelDomainResponse,
): VercelDomainStatus {
  return {
    domain: response.name ?? response.domain ?? domain,
    verified: response.verified === true,
    records:
      response.verification?.map((record) => ({
        type: record.type ?? "CNAME",
        name: record.domain ?? domain,
        value: record.value ?? "cname.vercel-dns.com",
        reason: record.reason,
      })) ?? [],
  };
}

export async function registerCustomDomain(domain: string) {
  const { token } = requireVercelConfig();
  const response = await fetch(projectDomainUrl(), {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ name: domain }),
  });
  const body = await readVercelJson(response);

  return toDomainStatus(domain, body);
}

export async function getCustomDomainStatus(domain: string) {
  const { token } = requireVercelConfig();
  const response = await fetch(projectDomainUrl(domain), {
    method: "GET",
    headers: headers(token),
  });
  const body = await readVercelJson(response);

  return toDomainStatus(domain, body);
}

export async function removeCustomDomain(domain: string) {
  const { token } = requireVercelConfig();
  const response = await fetch(projectDomainUrl(domain), {
    method: "DELETE",
    headers: headers(token),
  });

  if (response.status === 404) {
    return;
  }

  await readVercelJson(response);
}
