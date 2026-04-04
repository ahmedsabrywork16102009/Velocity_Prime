// state.js — Shared mutable state for the MAIN world engine.
// All modules import this object and mutate it directly.

export const state = {
    desiredSpeed:  1.0,
    trackedVideos: new Set(),
};
