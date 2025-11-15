import type { Giveaway, SocialAccount } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type FetchLike = typeof fetch;

export class MetaAdapter {
  private fetch: FetchLike;
  private graphBase = "https://graph.facebook.com";
  private graphVersion = process.env.META_GRAPH_VERSION || "v21.0";

  constructor(fetchImpl?: FetchLike) {
    this.fetch = fetchImpl ?? fetch;
  }

  // Resolves and caches pageId/instagramBusinessId onto the company's SocialAccount if missing
  private async ensureCompanyMetaContext(companyId: string): Promise<Pick<SocialAccount, "accessToken" | "pageId" | "instagramBusinessId">> {
    const account = await prisma.socialAccount.findFirst({
      where: { companyId, network: "facebook" },
    });
    if (!account?.accessToken) {
      throw new Error("Company Meta access token not found");
    }

  const { accessToken } = account;
    let { pageId, instagramBusinessId } = account;

    if (!pageId || !instagramBusinessId) {
      // Find first page with instagram_business_account
      const url = new URL(`${this.graphBase}/${this.graphVersion}/me/accounts`);
      url.searchParams.set("access_token", accessToken);
      url.searchParams.set("fields", "id,name,instagram_business_account");
      const res = await this.fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`Meta accounts fetch failed: ${await safeText(res)}`);
      const data = (await res.json()) as { data: Array<{ id: string; name: string; instagram_business_account?: { id: string } }>; paging?: unknown };
      const withIg = data.data.find((p) => p.instagram_business_account?.id);
      if (withIg) {
        pageId = withIg.id;
        instagramBusinessId = withIg.instagram_business_account!.id;
        // Cache for future
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { pageId, instagramBusinessId },
        });
      }
    }

    if (!instagramBusinessId) {
      throw new Error("instagramBusinessId not available for company Page");
    }

    return { accessToken, pageId: pageId ?? null, instagramBusinessId };
  }

  private async resolveInstagramMediaId(permalink: string, igBusinessId: string, accessToken: string): Promise<string | null> {
    // Strategy: list recent media and match by permalink
    let url = new URL(`${this.graphBase}/${this.graphVersion}/${igBusinessId}/media`);
    url.searchParams.set("fields", "id,permalink,timestamp");
    url.searchParams.set("limit", "50");
    url.searchParams.set("access_token", accessToken);

    for (let i = 0; i < 10; i++) { // page at most 10 times to avoid long loops
      const res = await this.fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`IG media fetch failed: ${await safeText(res)}`);
      const json = (await res.json()) as { data: Array<{ id: string; permalink: string }>; paging?: { next?: string } };
      const match = json.data.find((m) => normalizeUrl(m.permalink) === normalizeUrl(permalink));
      if (match) return match.id;
      if (json.paging?.next) {
        url = new URL(json.paging.next);
      } else {
        break;
      }
    }
    return null;
  }

  async verifyLike(opts: { userId: string; postUrl: string; giveaway: Giveaway }): Promise<boolean> {
    // Instagram Graph API does not provide the list of users who liked a media; return false for IG.
    if (opts.giveaway.network === "instagram") {
      return false;
    }
    // TODO: Implement Facebook Page post likes verification if giveaways on facebook are supported.
    return false;
  }

  async verifyComment(opts: { userId: string; postUrl: string; giveaway: Giveaway }): Promise<{ ok: boolean; mentions?: number }> {
    const { giveaway, postUrl, userId } = opts;
    if (giveaway.network !== "instagram") {
      // Not implemented for FB yet
      return { ok: false };
    }

    // Participant must have linked their Instagram account to know providerUserId
    const participantAccount = await prisma.socialAccount.findFirst({ where: { userId, network: "instagram" } });
    const participantIgId = participantAccount?.providerUserId;
    if (!participantIgId) {
      return { ok: false };
    }

    const { accessToken, instagramBusinessId } = await this.ensureCompanyMetaContext(giveaway.companyId);
    const mediaId = await this.resolveInstagramMediaId(postUrl, instagramBusinessId!, accessToken!);
    if (!mediaId) return { ok: false };

    // Fetch comments (paged)
    let url = new URL(`${this.graphBase}/${this.graphVersion}/${mediaId}/comments`);
    url.searchParams.set("access_token", accessToken!);
    url.searchParams.set("fields", "id,text,username,user");
    url.searchParams.set("limit", "50");

    let found = false;
    let mentions = 0;
    for (let i = 0; i < 20 && !found; i++) {
      const res = await this.fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`IG comments fetch failed: ${await safeText(res)}`);
      const json = (await res.json()) as { data: Array<{ id: string; text: string; username?: string; user?: { id?: string; username?: string } }>; paging?: { next?: string } };
      for (const c of json.data) {
        const commenterId = c.user?.id;
        if (commenterId === participantIgId) {
          found = true;
          mentions = countMentions(c.text ?? "");
          break;
        }
      }
      if (found) break;
      if (json.paging?.next) url = new URL(json.paging.next); else break;
    }

    return { ok: found, mentions: found ? mentions : 0 };
  }
}

function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    url.hash = "";
    // Remove trailing slash
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return u;
  }
}

function countMentions(text: string): number {
  const matches = text.match(/@([A-Za-z0-9_\.]+)/g);
  return matches ? matches.length : 0;
}

async function safeText(res: Response) {
  try { return await res.text(); } catch { return "<no-body>"; }
}
