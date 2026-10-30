export type SubscriptionStatus = 'active' | 'disabled' | 'expired';

export type SubscriptionPackage = 'all' | 'nasional' | 'premium';

export interface Subscriber {
  id: string;
  code: string; // e.g. "SPEED-8821-4912"
  name: string; // Customer / viewer name (e.g. "Budi Santoso", "Pak RT 04")
  phone?: string;
  status: SubscriptionStatus;
  package: SubscriptionPackage;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string or "permanent"
  deviceLimit: number;
  notes?: string;
  lastActiveAt?: string;
  lastChannel?: string;
  lastIp?: string;
}

export interface VerificationResult {
  valid: boolean;
  subscriber?: Subscriber;
  reason?: string;
  remainingDays?: number;
}
