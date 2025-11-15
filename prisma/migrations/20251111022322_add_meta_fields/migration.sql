-- AlterTable
ALTER TABLE "SocialAccount" ADD COLUMN "accessToken" TEXT;
ALTER TABLE "SocialAccount" ADD COLUMN "accessTokenExpiresAt" DATETIME;
ALTER TABLE "SocialAccount" ADD COLUMN "instagramBusinessId" TEXT;
ALTER TABLE "SocialAccount" ADD COLUMN "pageId" TEXT;
ALTER TABLE "SocialAccount" ADD COLUMN "providerUserId" TEXT;
ALTER TABLE "SocialAccount" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "SocialAccount" ADD COLUMN "scope" TEXT;
