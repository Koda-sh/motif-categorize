# `@koda.sh/motif-categorize` API Surface

## Factory Functions

### `createCollection<T = string>(items?: readonly T[], options?: CollectionOptions<T>): MotifCollection<T>`

Creates a new `MotifCollection<T>` from an optional initial array of items.

- `items`: Initial items to fingerprint and add to the collection (defaults to `[]`).
- `options`: Optional `CollectionOptions<T>` configuration.

### `loadCollection<T = string>(serialized: SerializedCollection, items: readonly T[], options?: CollectionOptions<T>): MotifCollection<T>`

Restores a `MotifCollection<T>` from a previously exported `SerializedCollection` without re-hashing existing items.

- `serialized`: The object returned by `collection.export()`.
- `items`: The original items array corresponding to `serialized.entries`.
- `options`: Optional `CollectionOptions<T>` (uses `serialized.hash` if `options.hash` is not provided).
- Throws an `Error` if `serialized.version` is not supported.

---

## `MotifCollection<T>`

### Properties

- `size: number` — Number of items currently in the collection.
- `items: readonly T[]` — Shallow view of the items in the collection.
- `fingerprint: Fingerprint` — The composite `Fingerprint` representing all items in the collection (lazily computed and cached until mutated).

### Methods

- `add(...items: T[]): MotifCollection<T>`
  - Fingerprints each item and appends it to the collection, marking the composite dirty. Returns `this` for chaining.
- `remove(predicate: (item: T, index: number) => boolean): number`
  - Removes items matching `predicate`, marks the composite dirty if any were removed, and returns the number of removed items.
- `compare(query: QueryInput): ComparisonResult`
  - Compares a `string`, `Fingerprint`, or `FingerprintRecord` against the collection's composite `Fingerprint` and returns a `@koda.sh/motif-core` `ComparisonResult` (`similarity`, `distance`, `matches`, `size`, and optional `containment`).
  - Throws a `TypeError` if `query` is not a `string`, `Fingerprint`, or `FingerprintRecord`.
- `export(): SerializedCollection`
  - Returns a JSON-safe `SerializedCollection` containing `version`, `hash`, `composite`, and `entries`.

---

## Types

- `QueryInput`: `string | Fingerprint | FingerprintRecord`
- `CollectionOptions<T>`:
  - `hash?: HashOptions` — Hashing options passed to `@koda.sh/motif-core`.
  - `composite?: Omit<CompositeOptions, "create">` — Composite aggregation options passed to `@koda.sh/motif-core` (defaults to `min` aggregation for MinHash union).
  - `getFn?: (item: T) => string` — Custom text extractor for non-string items.
- `SerializedCollection`:
  - `version: number`
  - `hash?: HashOptions`
  - `composite: number[]`
  - `entries: number[][]`

## Constants

- `VERSION`: `"0.1.0"`
