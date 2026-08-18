# Learning-Path-First, Low-Text Mobile Design

Date: 2026-08-10

## Goal

Make Bagu feel like a learning app rather than a dashboard: opening the app immediately shows the active learning path, overview screens use far less text, and the primary flow remains reliable in Expo Go on iPhone.

## Research references

- `mazkev/Duolingo-clone-react-native-expo` (MIT): validates the compact unit-banner plus winding-node path pattern in an Expo app.
- `sanidhyy/duolingo-clone` (MIT): validates showing a small callout only on the current node while completed and locked nodes communicate state visually.
- `expo/examples` (MIT): supports keeping the standard Expo Router tab navigator instead of introducing a custom navigation layer.
- `expo/expo#37796`: documents touch failures around incorrectly wrapped custom tab triggers; Bagu will retain standard `Tabs` and direct screen declarations.
- `adrianhajdin/react-native-lingua` has no declared license. It was used only to compare information hierarchy; no code or assets will be copied.

## Product decisions

### Navigation

The app has four primary tabs:

1. 学习
2. 知识
3. 复习
4. 我的

`(tabs)/index.tsx` is the learning path and remains the `/` route. The separate 今日 tab is removed because its next-task information duplicates the current path node. The existing `/path` route becomes a redirect to `/` so old internal links remain safe.

The app keeps Expo Router's standard `Tabs`. No custom tab overlay, gesture catcher, or absolute-positioned navigation layer may be introduced.

### Learning screen

The initial learning screen contains only:

- A compact status row with streak, XP, and focus counters.
- A single unit banner with unit name and progress.
- A winding vertical lesson path.
- The persistent four-item tab bar.

The current node has a short `开始` callout and is the dominant action. Completed nodes show a check. Locked nodes show a lock and cannot be pressed. Only the current node displays a lesson label; other nodes rely on state and accessibility labels. Tapping an available node opens the existing lesson route.

### Text budget and progressive disclosure

- Remove English eyebrows, greetings, repeated subtitles, dashboard introductions, and explanatory paragraphs from overview screens.
- The learning screen's first viewport must contain no more than six non-tab text groups, excluding numeric counters.
- Overview cards use a title and, only when essential, one short metadata line. They do not use explanatory paragraphs.
- Detailed concepts, interview explanations, and learning content remain available after the user opens a lesson, knowledge card, project screen, or modal. The change reduces navigation copy, not educational substance.
- Icons never replace accessibility: interactive elements retain explicit accessibility labels and roles.

### Secondary screens

- 知识: show the native screen title, search, filter chips, and cards. Remove the English eyebrow and introductory paragraph.
- 复习: show the title, compact queue state, and review items. Remove motivational or instructional paragraphs from the overview.
- 我的: retain progress, sound, resume/project, and mastery functionality, but shorten card copy and remove the profile introduction and promotional interview card.
- Mock interview and resume/project deep-dive remain reachable from contextually relevant screens, not as advertisements on the learning home screen.

## Component boundaries

- `learning-path-screen`: composes progress state, the compact header, unit banner, and course path.
- `learning-status-bar`: renders only the three icon counters and has no navigation responsibility.
- `unit-banner`: renders the active unit title and completion fraction.
- `course-path`: renders the winding guide and lesson nodes from lesson data; it does not read global state directly.
- `lesson-node`: owns visual state, press feedback, accessibility, and the current-node callout.
- Existing progress context remains the source of completion, XP, streak, focus, review, and unlock state.

Components live outside the Expo Router route directory. Route files only compose screens and navigation.

## Data and behavior

1. `ProgressProvider` loads saved progress.
2. The learning route derives the first unlocked, incomplete lesson.
3. The path receives lessons plus completed/unlocked/current state.
4. Pressing an unlocked node navigates to `/lesson/[id]`.
5. Completing the lesson updates the existing progress context and storage.
6. Returning to `/` redraws the node states and progress counters.

If every lesson is complete, all nodes remain replayable and the unit banner shows full progress. Locked nodes ignore presses. Missing lesson identifiers continue to use the existing lesson-route not-found handling.

## Visual and interaction rules

- Continue the existing purple, green, amber, and neutral palette.
- Use rounded, continuous-looking surfaces and bottom-edge depth on path nodes.
- Touch targets are at least 44 by 44 points.
- Pressed nodes visibly move or compress without delaying navigation.
- The screen scrolls naturally on small iPhones and respects top and bottom safe areas.
- No hidden modal, overlay, or decorative layer may intercept touches.
- Preserve Expo Go compatibility; do not add a native dependency for this redesign.

## Verification

Required automated checks:

- `npx tsc --noEmit`
- `npm run lint`
- `npx expo-doctor@latest`
- `npx expo export --platform web`
- `npx expo export --platform ios`

Required behavior checks:

- `/` renders the path rather than a dashboard.
- Four and only four primary tabs are rendered.
- Current and completed nodes open their lesson routes.
- Locked nodes do not navigate.
- `/path` resolves back to `/`.
- Knowledge, review, profile, lesson, resume, and interview routes remain reachable.
- At a 390 x 844 viewport, the current lesson action and tab bar are visible and clickable, scrolling does not hide content, and no overlay blocks presses.
- The generated iOS bundle remains compatible with the installed Expo SDK and Expo Go.

## Out of scope

- New course content, authentication, cloud sync, backend APIs, community features, monetization, or a custom native build.
- Copying Duolingo trademarks, mascots, illustrations, sound assets, or proprietary text.
