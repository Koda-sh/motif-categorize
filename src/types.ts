import type {
  ComparisonResult,
  CompositeOptions,
  Fingerprint,
  FingerprintRecord,
  HashOptions,
} from "@koda.sh/motif-core";

export type QueryInput = string | Fingerprint | FingerprintRecord;

export interface CollectionOptions<T> {
  /** Hashing options passed to `@koda.sh/motif-core`. */
  hash?: HashOptions;
  /** Composite aggregation options passed to `@koda.sh/motif-core`. */
  composite?: Omit<CompositeOptions, "create">;
  /** Custom text extractor for non-string items. */
  getFn?: (item: T) => string;
}

export interface SerializedCollection {
  version: number;
  hash?: HashOptions;
  composite: number[];
  entries: number[][];
}

export interface MotifCollection<T> {
  /** Number of items currently in the collection. */
  readonly size: number;
  /** Shallow view of the items in the collection. */
  readonly items: readonly T[];
  /** Composite fingerprint representing all items in the collection. */
  readonly fingerprint: Fingerprint;
  /** Add one or more items to the collection. */
  add(...items: T[]): MotifCollection<T>;
  /** Remove items matching the predicate and return the count removed. */
  remove(predicate: (item: T, index: number) => boolean): number;
  /** Compare a query string, Fingerprint, or FingerprintRecord against the collection's composite fingerprint. */
  compare(query: QueryInput): ComparisonResult;
  /** Serialize the collection's fingerprints and composite for persistence. */
  export(): SerializedCollection;
}
