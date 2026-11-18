import { describe, expect, it } from "vitest";
import { hash } from "@koda.sh/motif-core";
import { createCollection, loadCollection } from "../src/index.js";

describe("motif-collections", () => {
  it("creates an empty collection and adds items", () => {
    const col = createCollection<string>();
    expect(col.size).toBe(0);
    expect(col.items).toEqual([]);

    col.add("typescript minhash fingerprint", "javascript similarity search");
    expect(col.size).toBe(2);
    expect(col.items).toEqual([
      "typescript minhash fingerprint",
      "javascript similarity search",
    ]);
  });

  it("compares a query against the composite fingerprint", () => {
    const col = createCollection([
      "machine learning neural networks deep learning",
      "artificial intelligence gradient descent backpropagation",
      "transformer attention mechanism language model",
    ]);

    const related = col.compare("neural networks and deep learning models");
    const unrelated = col.compare("chocolate chip cookie recipe with butter");

    expect(related.similarity).toBeGreaterThan(unrelated.similarity);
    expect(related.similarity).toBeGreaterThan(0);
    expect(related.size).toBe(col.fingerprint.length);
  });

  it("accepts Fingerprint and FingerprintRecord queries", () => {
    const col = createCollection([
      "distributed systems consensus raft paxos",
      "fault tolerant replicated state machine",
    ]);

    const record = hash("raft consensus algorithm");
    const fromString = col.compare("raft consensus algorithm");
    const fromRecord = col.compare(record);
    const fromFp = col.compare(record.fingerprint);

    expect(fromRecord.similarity).toBe(fromString.similarity);
    expect(fromFp.similarity).toBe(fromString.similarity);
  });

  it("supports custom getFn for object items", () => {
    interface Doc {
      id: number;
      title: string;
    }

    const docs: Doc[] = [
      { id: 1, title: "GraphQL schema stitching and federation" },
      { id: 2, title: "REST API pagination and caching" },
    ];

    const col = createCollection(docs, {
      getFn: (doc) => doc.title,
    });

    const match = col.compare("GraphQL federation schema");
    const miss = col.compare("quantum mechanics wave function");

    expect(match.similarity).toBeGreaterThan(miss.similarity);
  });

  it("removes items and updates the composite fingerprint", () => {
    const col = createCollection([
      "alpha beta gamma delta",
      "epsilon zeta eta theta",
    ]);

    const before = col.compare("epsilon zeta eta theta");
    const removed = col.remove((item) => item.startsWith("epsilon"));

    expect(removed).toBe(1);
    expect(col.size).toBe(1);

    const after = col.compare("epsilon zeta eta theta");
    expect(after.similarity).toBeLessThan(before.similarity);
  });

  it("exports and loads a collection without re-hashing", () => {
    const items = [
      "rust systems programming memory safety",
      "borrow checker ownership lifetimes",
    ];
    const col = createCollection(items);
    const serialized = JSON.parse(JSON.stringify(col.export()));

    const restored = loadCollection(serialized, items);
    expect(restored.size).toBe(2);
    expect(restored.compare("rust ownership").similarity).toBe(
      col.compare("rust ownership").similarity,
    );
  });

  it("throws on invalid query or unsupported serialized version", () => {
    const col = createCollection(["hello world"]);
    expect(() => col.compare(123 as unknown as string)).toThrow(TypeError);

    const bad = { version: 99, composite: [], entries: [] };
    expect(() => loadCollection(bad, [])).toThrow(/Unsupported serialized collection version/);
  });
});
