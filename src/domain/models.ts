// Domain interfaces (MVP placeholders)
export type SocialNetwork = "instagram" | "x" | "tiktok" | "facebook";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  socialAccounts: SocialAccount[];
}

export interface SocialAccount {
  id: string;
  network: SocialNetwork;
  handle: string; // @usuario
  tokenType?: "short" | "long"; // para Meta largo plazo
}

export interface CompanyAccount {
  id: string;
  legalName: string;
  taxId: string; // CIF/NIF
  fiscalAddress?: string;
  contactEmail: string;
  socialAccounts: SocialAccount[];
}

export type RequirementType = "like" | "comment" | "mentions" | "follow";

export interface Requirement {
  id: string;
  type: RequirementType;
  required: boolean;
  mentionsCount?: number; // Para type mentions/comment
  profileToFollow?: string; // handle de la cuenta
}

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  network: SocialNetwork;
  postUrl: string;
  companyId: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  requirements: Requirement[];
  basesUrl?: string;
  status: "draft" | "active" | "awaiting_winner" | "finished";
}

export interface Participation {
  id: string;
  giveawayId: string;
  userId: string;
  entries: number; // total participaciones obtenidas
  createdAt: string;
  isWinner?: boolean;
  verificationStatus?: "pending" | "approved" | "rejected";
}

export interface WinnerSelection {
  id: string;
  giveawayId: string;
  executedAt: string;
  primaryParticipationId: string;
  backups: string[]; // ids de participations suplentes
}
