import { RateLimitError } from './errors';

type RateLimitKey = string;

type Bucket = {
  count: number;
  expires: number;
};

const store = new Map<RateLimitKey, Bucket>();

export function enforceRateLimit(
  key: RateLimitKey,
  { windowMs, max }: { windowMs: number; max: number },
) {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.expires < now) {
    store.set(key, { count: 1, expires: now + windowMs });
    return;
  }

  if (bucket.count >= max) {
    throw new RateLimitError();
  }

  bucket.count += 1;
}
