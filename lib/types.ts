export type Relationship =
  | "partner"
  | "family"
  | "friend"
  | "mentor"
  | "pet"
  | "group"
  | "other";

export type PhotoSource = "upload" | "google" | "camera" | "folder" | "demo";

export type PlanId = "free" | "plus" | "family";

export type Season = "spring" | "summer" | "autumn" | "winter";

export type BillingInterval = "month" | "year";

export type Person = {
  id: string;
  name: string;
  relationship: Relationship;
  hue: number;
  avatarUrl?: string;
  faceSignature?: number[];
  createdAt: number;
  hidden?: boolean;
};

export type Photo = {
  id: string;
  thumbUrl: string;
  takenAt: number;
  personIds: string[];
  source: PhotoSource;
  fileName?: string;
  width?: number;
  height?: number;
};

export type PhotoSourceState = {
  id: string;
  kind: PhotoSource;
  label: string;
  connected: boolean;
  lastSyncAt?: number;
  watchEnabled?: boolean;
};

export type You = {
  name: string;
  avatarUrl?: string;
};

export type GroveState = {
  you: You;
  people: Person[];
  photos: Photo[];
  plan: PlanId;
  season: Season;
  sources: PhotoSourceState[];
  onboardingComplete: boolean;
  liveSync: boolean;
  watermarkOverride?: boolean;
};

export type ShareSnapshot = {
  version: 1;
  code: string;
  createdAt: number;
  youName: string;
  season: Season;
  watermark: boolean;
  people: Array<{
    id: string;
    name: string;
    relationship: Relationship;
    hue: number;
    memoryCount: number;
    avatarUrl?: string;
    sampleThumbs: string[];
  }>;
  focusPersonId?: string;
};

export type ScanProgress = {
  total: number;
  done: number;
  faces: number;
  people: number;
  status: string;
};
