export enum VideoJobStatus {
  QUEUED = "queued",
  GENERATING_SCRIPT = "generating_script",
  GENERATING_VOICE = "generating_voice",
  RENDERING_VIDEO = "rendering_video",
  PUBLISHING = "publishing",
  USER_CONFIRMED = "user_confirmed",
  PUBLISHED_UNVERIFIED = "published_unverified",
  DONE = "done",
  FAILED = "failed",
}

export enum CampaignStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

export enum AffiliateProvider {
  DIGISTORE24 = "digistore24",
  IMPACT = "impact",
  AMAZON = "amazon",
  CLICKBANK = "clickbank",
  MANUAL = "manual",
}
