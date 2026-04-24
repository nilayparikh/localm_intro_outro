import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_SPLIT_BREAKPOINTS,
  DEFAULT_SPLIT_PARTITION_POINTS,
  insertSplitBreakpoint,
  parseSplitPartitionPoints,
  resolveSplitPartitionPoints,
  serializeSplitPartitionPoints,
  updateSplitBreakpoint,
  removeSplitBreakpoint,
} from "../../src/pages/thumbnailSplitPartition";

test("parseSplitPartitionPoints parses straight and zig-zag point sequences", () => {
  assert.deepEqual(parseSplitPartitionPoints("(12, 3), (12, 24)"), {
    ok: true,
    points: [
      { x: 12, y: 3 },
      { x: 12, y: 24 },
    ],
  });

  assert.deepEqual(
    parseSplitPartitionPoints(" (9, 1),\n(15.5, 9), (9, 18), (15, 24) "),
    {
      ok: true,
      points: [
        { x: 9, y: 1 },
        { x: 15.5, y: 9 },
        { x: 9, y: 18 },
        { x: 15, y: 24 },
      ],
    },
  );
});

test("parseSplitPartitionPoints rejects malformed point syntax", () => {
  const result = parseSplitPartitionPoints("12, 3), (12, 24)");

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /format/i);
  }
});

test("parseSplitPartitionPoints enforces coordinate bounds up to 24", () => {
  const withinRange = parseSplitPartitionPoints("(10, 3), (12, 24)");
  const badRange = parseSplitPartitionPoints("(12, 3), (27, 24)");

  assert.equal(withinRange.ok, true);
  assert.equal(badRange.ok, false);

  if (!badRange.ok) {
    assert.match(badRange.error, /between 0 and 24/i);
  }
});

test("resolveSplitPartitionPoints falls back to defaults when parsing fails", () => {
  assert.deepEqual(resolveSplitPartitionPoints("(12, 3), (12, 24)"), {
    points: [
      { x: 12, y: 3 },
      { x: 12, y: 24 },
    ],
    error: null,
  });

  assert.deepEqual(resolveSplitPartitionPoints("(13, 3), (42, 24)"), {
    points: DEFAULT_SPLIT_PARTITION_POINTS,
    error: "Each coordinate must be between 0 and 24.",
  });
});

test("serializeSplitPartitionPoints preserves editable decimal breakpoint values", () => {
  assert.equal(
    serializeSplitPartitionPoints([
      { x: 11.25, y: 0 },
      { x: 12, y: 13.5 },
      { x: 14.75, y: 24 },
    ]),
    "(11.25, 0), (12, 13.5), (14.75, 24)",
  );
});

test("insertSplitBreakpoint inserts and sorts a new point by y", () => {
  assert.deepEqual(
    insertSplitBreakpoint(
      [
        { x: 12, y: 0 },
        { x: 12, y: 24 },
      ],
      { x: 8.4, y: 12.2 },
    ),
    [
      { x: 12, y: 0 },
      { x: 8.4, y: 12.2 },
      { x: 12, y: 24 },
    ],
  );
});

test("updateSplitBreakpoint updates x or y while clamping to the valid range", () => {
  const updatedX = updateSplitBreakpoint(
    [
      { x: 12, y: 0 },
      { x: 12, y: 24 },
    ],
    1,
    "x",
    30,
  );

  assert.deepEqual(updatedX, [
    { x: 12, y: 0 },
    { x: 24, y: 24 },
  ]);

  const updatedY = updateSplitBreakpoint(updatedX, 0, "y", -4);

  assert.deepEqual(updatedY, [
    { x: 12, y: 0 },
    { x: 24, y: 24 },
  ]);
});

test("removeSplitBreakpoint never removes below two breakpoints", () => {
  const twoPoints = [
    { x: 12, y: 0 },
    { x: 12, y: 24 },
  ];

  assert.deepEqual(removeSplitBreakpoint(twoPoints, 1), twoPoints);

  const threePoints = [
    { x: 12, y: 0 },
    { x: 8, y: 12 },
    { x: 12, y: 24 },
  ];

  assert.deepEqual(removeSplitBreakpoint(threePoints, 1), [
    { x: 12, y: 0 },
    { x: 12, y: 24 },
  ]);
});

test("max split breakpoints constant is 24", () => {
  assert.equal(MAX_SPLIT_BREAKPOINTS, 24);
});
