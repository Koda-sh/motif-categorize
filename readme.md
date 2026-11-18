![motif-categorize](./docs/images/mcheader.png)

Composite fingerprint collections for fast set-level categorization and similarity comparison, powered by `@koda.sh/motif-core`.

Instead of comparing a query against every item in a collection, `motif-categorize` maintains a single composite `Fingerprint` (MinHash union by default) representing the entire collection and compares queries directly against it.

## Installation

```bash
npm install @koda.sh/motif-categorize @koda.sh/motif-core
```

## Quick Start

```ts
import { createCollection } from "@koda.sh/motif-categorize";

const ml = createCollection([
  "machine learning neural networks deep learning",
  "artificial intelligence gradient descent backpropagation",
  "transformer attention mechanism language model",
]);

const result = ml.compare("neural networks and deep learning models");
console.log(result.similarity); // 0.0 to 1.0
```

### Custom Objects & Serialization

```ts
import { createCollection, loadCollection } from "@koda.sh/motif-categorize";

const docs = createCollection(
  [
    { id: 1, title: "GraphQL schema stitching and federation" },
    { id: 2, title: "REST API pagination and caching" },
  ],
  { getFn: (doc) => doc.title },
);

docs.add({ id: 3, title: "gRPC streaming services" });

const saved = JSON.stringify(docs.export());
const restored = loadCollection(JSON.parse(saved), docs.items, {
  getFn: (doc) => doc.title,
});
```

## API

See [docs/surface.md](./docs/surface.md) for the full API reference.

## License

MPL-2.0

![Koda.sh](./docs/images/kmfooter.png)
