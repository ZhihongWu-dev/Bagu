# Strict Course Progression Design

## Goal

Keep the Transformer learning path linear: an unfinished lesson is unlocked only after every lesson before it has been completed.

## Existing progress

Previously completed lessons remain completed and can be replayed, even when older local test data contains gaps. A completed lesson after a gap does not unlock later unfinished lessons. No stored completion record is deleted or reordered.

## Access rule

A lesson is accessible when either condition is true:

1. The lesson is already completed.
2. Every lesson before it in the flattened course order is completed.

The first lesson is therefore initially accessible. Section boundaries do not reset progression.

## Enforcement

The progression rule is a pure domain function shared by the learning path and lesson route. The path renders inaccessible lessons as locked. A direct route to an inaccessible unfinished lesson returns to the learning path, preventing link-based bypasses.

## Verification

Tests cover the first lesson, normal sequential completion, cross-section progression, gapped historical completion, replaying completed lessons, and unknown lesson IDs. Existing TypeScript, lint, course validation, Expo Doctor, and platform export checks must continue to pass.
