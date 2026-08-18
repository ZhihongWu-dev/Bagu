(function attachAnnotationState(globalObject) {
  'use strict';

  function statusFor(sourceId, annotations) {
    return annotations[sourceId]?.status ?? 'pending';
  }

  function progress(candidates, annotations) {
    let completed = 0;
    let skipped = 0;
    let nextSourceId;
    for (const candidate of candidates) {
      const status = statusFor(candidate.sourceId, annotations);
      if (status === 'completed') completed += 1;
      else if (status === 'skipped') skipped += 1;
      else if (!nextSourceId) nextSourceId = candidate.sourceId;
    }
    return { total: candidates.length, completed, skipped, pending: candidates.length - completed - skipped, nextSourceId };
  }

  function nextPending(candidates, annotations, currentSourceId) {
    const currentIndex = Math.max(0, candidates.findIndex((candidate) => candidate.sourceId === currentSourceId));
    for (let offset = 1; offset <= candidates.length; offset += 1) {
      const candidate = candidates[(currentIndex + offset) % candidates.length];
      if (statusFor(candidate.sourceId, annotations) === 'pending') return candidate.sourceId;
    }
    return undefined;
  }

  function filteredCandidates(candidates, annotations, filter) {
    if (filter === 'all') return candidates;
    return candidates.filter((candidate) => statusFor(candidate.sourceId, annotations) === filter);
  }

  globalObject.AnnotationState = Object.freeze({ statusFor, progress, nextPending, filteredCandidates });
})(window);
