"use client";

export {
  AFFILIATE_MINT_CREATED_EVENT,
  AFFILIATE_MINT_UPDATED_EVENT,
} from "@/shared/lib/engagement/affiliate-minting/constants";

export {
  applyAgentMintedAffiliateLink,
  getAffiliateMintQueueSnapshot as buildAffiliateMintQueueSnapshot,
  queueAffiliateMintForSubmission,
  resolveSubmissionAffiliateUrl,
  rollbackAffiliateReplacement,
} from "@/shared/lib/engagement/affiliate-minting/service";
