import {
  composite,
  Fingerprint,
  hash,
  min,
  type ComparisonResult,
  type FingerprintRecord,
  type HashOptions,
} from "@koda.sh/motif-core";
import type {
  CollectionOptions,
  MotifCollection,
  QueryInput,
  SerializedCollection,
} from "./types.js";

export const VERSION = "0.1.0";
const COLLECTION_FORMAT_VERSION = 1;

export type * from "./types.js";

function isFingerprintRecord(value: unknown): value is FingerprintRecord {
  return (
    value !== null &&
    typeof value === "object" &&
    "fingerprint" in value &&
    (value as FingerprintRecord).fingerprint instanceof Uint32Array
  );
}

function resolveQuery(query: QueryInput, hashOptions?: HashOptions): Fingerprint {
  if (typeof query === "string") {
    return hash(query, hashOptions).fingerprint;
  }
  if (query instanceof Uint32Array) {
    return Fingerprint.fromArray(query);
  }
  if (isFingerprintRecord(query)) {
    return Fingerprint.fromArray(query.fingerprint);
  }
  throw new TypeError("Query must be a string, Fingerprint, or FingerprintRecord");
}

function extractText<T>(item: T, getFn?: (item: T) => string): string {
  if (getFn) {
    return getFn(item);
  }
  if (typeof item === "string") {
    return item;
  }
  if (item === null || item === undefined) {
    return "";
  }
  return String(item);
}

function buildCollection<T>(
  initialItems: readonly T[],
  options: CollectionOptions<T> = {},
  precomputed?: { composite: number[]; entries: number[][] },
): MotifCollection<T> {
  const hashOpts = options.hash;
  const compositeOpts = options.composite;
  const getFn = options.getFn;

  const items: T[] = [...initialItems];
  const entries: Fingerprint[] = [];
  let compositeFp: Fingerprint | null = null;
  let dirty = true;

  if (precomputed) {
    for (let i = 0; i < items.length; i++) {
      const raw = precomputed.entries[i];
      if (raw) {
        entries.push(Fingerprint.fromArray(new Uint32Array(raw)));
      } else {
        entries.push(hash(extractText(items[i], getFn), hashOpts).fingerprint);
      }
    }
    compositeFp = Fingerprint.fromArray(new Uint32Array(precomputed.composite));
    dirty = false;
  } else {
    for (let i = 0; i < items.length; i++) {
      entries.push(hash(extractText(items[i], getFn), hashOpts).fingerprint);
    }
  }

  function getComposite(): Fingerprint {
    if (dirty || compositeFp === null) {
      compositeFp = composite(entries, {
        aggregator: min,
        ...compositeOpts,
        create: hashOpts,
      });
      dirty = false;
    }
    return compositeFp;
  }

  const collection: MotifCollection<T> = {
    get size() {
      return items.length;
    },

    get items() {
      return items;
    },

    get fingerprint() {
      return getComposite();
    },

    add(...newItems) {
      for (const item of newItems) {
        items.push(item);
        entries.push(hash(extractText(item, getFn), hashOpts).fingerprint);
      }
      if (newItems.length > 0) {
        dirty = true;
      }
      return collection;
    },

    remove(predicate) {
      let removed = 0;
      for (let i = items.length - 1; i >= 0; i--) {
        if (predicate(items[i]!, i)) {
          items.splice(i, 1);
          entries.splice(i, 1);
          removed++;
        }
      }
      if (removed > 0) {
        dirty = true;
      }
      return removed;
    },

    compare(query: QueryInput): ComparisonResult {
      const queryFp = resolveQuery(query, hashOpts);
      return queryFp.compare(getComposite());
    },

    export(): SerializedCollection {
      return {
        version: COLLECTION_FORMAT_VERSION,
        hash: hashOpts,
        composite: Array.from(getComposite()),
        entries: entries.map((fp) => Array.from(fp)),
      };
    },
  };

  return collection;
}

/**
 * Create a new MotifCollection from an initial list of items.
 */
export function createCollection<T = string>(
  items: readonly T[] = [],
  options?: CollectionOptions<T>,
): MotifCollection<T> {
  return buildCollection(items, options);
}

/**
 * Restore a MotifCollection from a previously exported SerializedCollection.
 */
export function loadCollection<T = string>(
  serialized: SerializedCollection,
  items: readonly T[],
  options?: CollectionOptions<T>,
): MotifCollection<T> {
  if (serialized.version !== COLLECTION_FORMAT_VERSION) {
    throw new Error(`Unsupported serialized collection version: ${serialized.version}`);
  }
  return buildCollection(
    items,
    {
      ...options,
      hash: options?.hash ?? serialized.hash,
    },
    {
      composite: serialized.composite,
      entries: serialized.entries,
    },
  );
}
