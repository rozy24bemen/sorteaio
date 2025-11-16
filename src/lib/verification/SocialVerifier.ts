import { prisma } from "@/lib/prisma";
import type { Requirement, Participation, Giveaway } from "@prisma/client";
import { MetaAdapter } from "@/lib/meta/MetaAdapter";

export type VerificationDetail = {
  type: Requirement["type"];
  ok: boolean;
  reason?: string;
};

export type VerificationResult = {
  status: "approved" | "rejected" | "pending";
  checked: VerificationDetail[];
};

export interface NetworkAdapter {
  verifyFollow(opts: { userId: string; profile: string; giveaway: Giveaway }): Promise<boolean>;
  verifyLike(opts: { userId: string; postUrl: string; giveaway: Giveaway }): Promise<boolean>;
  verifyComment(opts: { userId: string; postUrl: string; giveaway: Giveaway }): Promise<{ ok: boolean; mentions?: number }>;
}

function getMockAdapter(): NetworkAdapter {
  const passAll = process.env.MOCK_VERIFICATION === "pass";
  const failAll = process.env.MOCK_VERIFICATION === "fail";

  return {
    async verifyFollow() {
      if (failAll) return false;
      if (passAll) return true;
      // Default: approve for deterministic tests unless overridden
      return true;
    },
    async verifyLike() {
      if (failAll) return false;
      if (passAll) return true;
      return true;
    },
    async verifyComment() {
      if (failAll) return { ok: false };
      if (passAll) return { ok: true, mentions: 2 };
      return { ok: true, mentions: 1 };
    },
  };
}

export class SocialVerifier {
  private adapter: NetworkAdapter;

  constructor(adapter?: NetworkAdapter) {
    if (adapter) {
      this.adapter = adapter;
    } else {
      // Decide between mock and real adapter
      const useMock = process.env.MOCK_VERIFICATION && process.env.MOCK_VERIFICATION !== "";
      if (useMock) {
        this.adapter = getMockAdapter();
      } else {
        const meta = new MetaAdapter();
        // Bridge MetaAdapter to NetworkAdapter shape
        this.adapter = {
          verifyFollow: async () => false, // Follow verification not yet implemented
          verifyLike: (opts) => meta.verifyLike(opts),
          verifyComment: (opts) => meta.verifyComment(opts),
        };
      }
    }
  }

  async verifyParticipation(participationId: string, userId: string): Promise<VerificationResult> {
    const participation = await prisma.participation.findUnique({
      where: { id: participationId },
      include: { giveaway: { include: { requirements: true } } },
    });

    if (!participation) {
      throw Object.assign(new Error("Participation not found"), { status: 404 });
    }
    if (participation.userId !== userId) {
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    }

    const { giveaway } = participation as Participation & { giveaway: Giveaway & { requirements: Requirement[] } };

    // If there are no requirements, auto-approve
    if (!giveaway.requirements || giveaway.requirements.length === 0) {
      return { status: "approved", checked: [] };
    }

  const checked: VerificationDetail[] = [];

    for (const req of giveaway.requirements) {
      if (req.type === "follow") {
        const profile = req.profileToFollow;
        if (!profile) {
          checked.push({ type: req.type, ok: false, reason: "Missing profileToFollow" });
          continue;
        }
        const ok = await this.adapter.verifyFollow({ userId, profile, giveaway });
        checked.push({ type: req.type, ok, reason: ok ? undefined : "Not following" });
      } else if (req.type === "like") {
        const ok = await this.adapter.verifyLike({ userId, postUrl: giveaway.postUrl, giveaway });
        checked.push({ type: req.type, ok, reason: ok ? undefined : "No like" });
      } else if (req.type === "comment") {
        const { ok } = await this.adapter.verifyComment({ userId, postUrl: giveaway.postUrl, giveaway });
        checked.push({ type: req.type, ok, reason: ok ? undefined : "No comment" });
      } else if (req.type === "mentions") {
        const min = req.mentionsCount ?? 1;
        const { ok, mentions } = await this.adapter.verifyComment({ userId, postUrl: giveaway.postUrl, giveaway });
        const okMentions = ok && (mentions ?? 0) >= min;
        checked.push({ type: req.type, ok: okMentions, reason: okMentions ? undefined : `Needs ${min} mentions` });
      }
    }

    // Respect requirement.required: only required items must pass.
    const allRequiredOk = giveaway.requirements.every((req, idx) => {
      if (!req.required) return true;
      return checked[idx]?.ok === true;
    });
    const status: VerificationResult["status"] = allRequiredOk ? "approved" : "rejected";
    return { status, checked };
  }
}
