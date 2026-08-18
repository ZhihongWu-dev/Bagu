'use strict';

function aggregateEvents(events) {
  const days = new Map();
  const sessions = new Map();
  const installations = new Map();
  const lessons = new Map();
  const exercises = new Map();
  const features = {};

  for (const event of events) {
    const day = event.occurred_at.slice(0, 10);
    const dayStats = getOrCreate(days, day, () => ({ installations: new Set(), sessions: new Set(), events: 0 }));
    dayStats.installations.add(event.installation_id);
    dayStats.sessions.add(event.session_id);
    dayStats.events += 1;

    const session = getOrCreate(sessions, event.session_id, () => ({ installation_id: event.installation_id, first: event.occurred_at, last: event.occurred_at, last_event: event.event_name }));
    if (event.occurred_at < session.first) session.first = event.occurred_at;
    if (event.occurred_at >= session.last) {
      session.last = event.occurred_at;
      session.last_event = event.event_name;
    }

    const installationDays = getOrCreate(installations, event.installation_id, () => new Set());
    installationDays.add(day);

    if (event.event_name === 'lesson_started' || event.event_name === 'lesson_completed') {
      const lesson = getOrCreate(lessons, event.properties.lesson_id, () => ({ starts: 0, completions: 0 }));
      if (event.event_name === 'lesson_started') lesson.starts += 1;
      else lesson.completions += 1;
    }
    if (event.event_name === 'exercise_answered') {
      const exercise = getOrCreate(exercises, event.properties.exercise_id, () => ({ answers: 0, first_answers: 0, first_correct: 0, attempts: new Map(), duration_ms: 0 }));
      exercise.answers += 1;
      if (event.properties.attempt_number === 1) {
        exercise.first_answers += 1;
        exercise.first_correct += event.properties.correct ? 1 : 0;
      }
      const attemptKey = `${event.installation_id}:${event.session_id}`;
      exercise.attempts.set(attemptKey, Math.max(exercise.attempts.get(attemptKey) ?? 0, event.properties.attempt_number));
      exercise.duration_ms += event.properties.duration_ms;
    }
    if (['knowledge_opened', 'knowledge_favorited', 'review_added', 'review_completed', 'resume_feature_opened', 'project_feature_opened'].includes(event.event_name)) {
      features[event.event_name] = (features[event.event_name] ?? 0) + 1;
    }
  }

  const sessionValues = [...sessions.values()];
  const dropoff = {};
  sessionValues.forEach((session) => { dropoff[session.last_event] = (dropoff[session.last_event] ?? 0) + 1; });
  const sessionDurationTotal = sessionValues.reduce((sum, session) => sum + Math.max(0, Date.parse(session.last) - Date.parse(session.first)), 0);
  const funnelNames = ['app_opened', 'lesson_started', 'exercise_answered', 'lesson_completed'];
  const funnel = Object.fromEntries(funnelNames.map((name) => [name, new Set(events.filter((event) => event.event_name === name).map((event) => event.installation_id)).size]));

  return {
    totals: {
      anonymous_users: installations.size,
      sessions: sessions.size,
      events: events.length,
      average_session_duration_ms: sessions.size ? Math.round(sessionDurationTotal / sessions.size) : 0,
    },
    funnel,
    retention: calculateRetention(installations),
    dropoff,
    days: Object.fromEntries([...days.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([day, value]) => [day, { active_users: value.installations.size, sessions: value.sessions.size, events: value.events }])),
    lessons: Object.fromEntries([...lessons.entries()].map(([id, value]) => [id, { ...value, completion_rate: value.starts ? round(value.completions / value.starts) : 0 }])),
    exercises: Object.fromEntries([...exercises.entries()].map(([id, value]) => [id, {
      answers: value.answers,
      first_correct_rate: value.first_answers ? round(value.first_correct / value.first_answers) : 0,
      average_attempts: value.attempts.size ? round([...value.attempts.values()].reduce((sum, count) => sum + count, 0) / value.attempts.size) : 0,
      average_duration_ms: value.answers ? Math.round(value.duration_ms / value.answers) : 0,
    }])),
    features,
  };
}

function calculateRetention(installations) {
  let eligibleD1 = 0;
  let retainedD1 = 0;
  let eligibleD7 = 0;
  let retainedD7 = 0;
  const today = dayNumber(new Date().toISOString().slice(0, 10));
  for (const days of installations.values()) {
    const dayNumbers = [...days].map(dayNumber).sort((a, b) => a - b);
    if (dayNumbers.length === 0) continue;
    const first = dayNumbers[0];
    if (today - first >= 1) {
      eligibleD1 += 1;
      if (dayNumbers.includes(first + 1)) retainedD1 += 1;
    }
    if (today - first >= 7) {
      eligibleD7 += 1;
      if (dayNumbers.includes(first + 7)) retainedD7 += 1;
    }
  }
  return {
    day_1: { eligible: eligibleD1, retained: retainedD1, rate: eligibleD1 ? round(retainedD1 / eligibleD1) : 0 },
    day_7: { eligible: eligibleD7, retained: retainedD7, rate: eligibleD7 ? round(retainedD7 / eligibleD7) : 0 },
  };
}

function dayNumber(day) {
  return Math.floor(Date.parse(`${day}T00:00:00.000Z`) / 86_400_000);
}

function round(value) {
  return Math.round(value * 10_000) / 10_000;
}

function getOrCreate(map, key, factory) {
  if (!map.has(key)) map.set(key, factory());
  return map.get(key);
}

module.exports = { aggregateEvents };
