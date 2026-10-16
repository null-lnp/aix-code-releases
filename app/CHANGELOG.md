# Changelog

## v0.8.0 — 2026-10-16

- **Diagrams, not ASCII art.** A ```` ```mermaid ```` block in a reply now renders as an
  interactive diagram instead of code:
  - **Drag** to pan, **scroll** to zoom at the cursor, **double-click** to zoom in (Shift to zoom
    out), `+` / `-` / `0` / arrow keys, zoom buttons with the current %, *Fit*, *Actual size*.
  - So the chat still scrolls normally, the wheel zooms once you click into a diagram (it gets
    an accent ring); before that a hint says so, and Ctrl+wheel or a trackpad pinch always zooms.
  - **Full screen** (Esc closes), a **source** toggle and **copy**.
  - Flowcharts, architecture and dependency graphs, sequence, class, state and ER diagrams,
    timelines, gantt charts, mind maps, git graphs, pie and bar/line charts. Labels come from the
    diagram type or its front-matter title.
  - Themed from the app's light and dark tokens: neutral nodes, soft shadows, Apple-like chart
    colours, a dotted canvas. Switching themes redraws them.
  - While a block is still streaming, it shows its source under "Writing flowchart…" and draws
    once the fence closes. A broken block shows the parse error with its source.
  - Mermaid loads on first use (its own chunk), draws one diagram at a time and caches the
    results, so scrolling and re-renders cost nothing. `securityLevel: strict`: no scripts and no
    click handlers.
- **The agent knows.** The app registers itself with the aix core as the desktop client
  (aix 2.12.0, `<display_capabilities>`), so the model draws graphs and charts as mermaid here
  instead of ASCII art. The terminal is unchanged.
- **A finished plan clears itself.** When every step is done, the plan dock plays its finale and
  then leaves, even while the summary is still being written. Your next message no longer brings
  the old checklist back: the core clears a finished plan when a new task starts, and the app
  drops it as soon as you send. An unfinished plan stays.
- **Aix Code.** The app is now called *Aix Code* (it was "aix Code"), and the agent is *Aix* in
  the app's text. Installs and updates are unaffected: the install folder, registry keys and data
  stay the same (Windows treats them case-insensitively), and the MSI upgrade code is pinned to
  the old value so MSI installs upgrade in place.
- **QA:** `diagrams.mjs` (with the `qa_diagrams` scenario) checks streaming, rendering, the
  error card, wheel and focus, drag, keys, buttons, the source toggle, full screen, both themes,
  and that a second message never shows the finished plan.
## v0.7.1 — 2026-10-16

- **Typing no longer makes the chat jump or flicker.** The composer used to resize itself on
  every keystroke by collapsing to one line, measuring and growing back. That collapse was
  invisible, but it let the chat above clamp its scroll position. Once the message was a few
  lines long, the chat slipped up by the composer's height. While aix was streaming it bounced
  up and down and then stopped following the answer, because the jump looked like you had
  scrolled up.
  - **The fix:** the composer now sizes itself to its text in CSS (`field-sizing: content`), with
    no collapse.
  - The chat only lets go of the bottom when you scroll it yourself (wheel, touch, keys,
    scrollbar or a text-selection drag). If the layout moves it while it follows the bottom, it
    snaps straight back.
  - Measured with the new QA flow: while typing four lines, 0 frames off the bottom and 0 scroll
    reversals, both idle and while an answer streams (before: 540 frames off the bottom, up to
    813 px, and 69 reversals). Scrolling up by hand still detaches, and scrolling back down
    re-attaches.
- **QA:** `typing-flicker.mjs` samples the transcript's scroll position, size and the composer's
  height on every frame while typing (idle and streaming), and checks hand scrolling.

## v0.7.0 — 2026-10-16

- **Finishing a task feels like it.** When a step in the task list completes:
  - its check slams in with a ring and a burst of green sparks;
  - the row flashes green;
  - a line draws through the text from left to right;
  - the counter ticks over.
  - When the last step completes, the checks ripple in a wave and the bar flares. Steps that were
    already done when you open a session don't animate.
- **The progress line greens up.** It starts as a pale wash and turns full green, with a growing
  glow, as the plan fills. The width springs forward, each completion sends a pulse from its
  leading edge, and a shine runs along the line, faster near the end.
- **Effort is a slider now, and it goes wild.** The pill shows a 5-bar power meter in the level's
  colour. The bars pulse at Extra high, flicker at Max and shimmer at Ultra. Clicking it opens a
  slider; drag it, use the arrow keys or click a label. Each level has its own energy:
  - **Colour:** the track heats up from calm blue through violet and hot pink to orange-red, with
    racing stripes and a throbbing, glowing thumb.
  - **Particles:** the thumb throws sparks; Max adds rising embers and a heat-wave label; Ultra
    adds lightning, orbiting plasma and a spinning pink/blue rim.
  - **Turning it up:** a spark burst and shockwave, the card shakes harder the higher you go, and
    the label rolls in.
  - **Turning it down:** it fizzles out in grey smoke.
  - Reduced motion keeps the slider and drops the show.
- **QA:** `effort-tasks.mjs` covers every level (keyboard), dragging, Esc, frame cost at Ultra,
  and the task animations (just-done, sparks, all-done, the bar's colour by progress).

## v0.6.0 — 2026-10-16

- **Response speed, at a glance.** The composer shows a small bar graph: one bar per model
  response, its tokens per second, and the current rate next to it. While a response streams, a
  pulsing bar and the number show the live rate.
- **Hover for the full picture:**
  - the rate now, or for the last response;
  - a larger graph of the last 40 responses with the average as a dashed line (hover a bar for
    that response's tokens, duration, time to first token, age and model);
  - average, peak, average time to first token and the number of responses;
  - the session's input (with the share served from cache), output (with reasoning), cost and
    what caching saved.
  - Click to keep the card open.
- **The numbers match the terminal app.** They come from aix's own speed meter (aix 2.11), the
  same one the `aix` header uses.
  - Each bar is a response's generation speed, measured from its first streamed token, so time to
    first token is reported separately. Hidden reasoning counts as generation.
  - The dashed line and "average" are the token-weighted mean of the bars.
  - Requests under 250 ms leave no bar.
  - Switching models keeps the graph.
  - A router or fallback model switch now also becomes the session's model, as in the terminal
    app, so the next turn doesn't start on the old one.
- **Turn footer:** "Worked for 1m 20s · ↑24k ↓1.6k · $0.04": the turn's input and output tokens
  and its cost. Hover it for the breakdown (cache share, reasoning tokens).
- **Now in the app:** before this, the desktop app showed none of the session totals the
  terminal app has (speed, tokens, cost, cache savings).
- **QA:** `make-speed-scenario.mjs` writes `qa_speed` (seven responses at different speeds).
  `speed.mjs` drives it: live samples, the card, bar hover, closing on leave, the turn footer and
  console errors.

## v0.5.2 — 2026-10-16

- **Auto-update works.** The source repo is private, so the app's anonymous request for the
  update manifest got a 404. The check failed silently and no update was ever announced. Releases
  are now published to the public
  [aix-code-releases](https://github.com/null-lnp/aix-code-releases) repo, which holds both aix
  Code and the aix CLI, and the updater reads `app/latest.json` from there. Installers are still
  verified with the app's update key before they install.
  - **One manual install needed:** versions up to 0.5.1 still look in the private repo. Install
    0.5.2 once from the releases page; from then on the app updates itself.
- **You hear about updates.**
  - The app checks shortly after start, every two hours (it used to be six), and when you come
    back to the window after half an hour or more.
  - A new version shows the banner and, once per version, a system notification (when
    notifications are on). **Later** hides the banner until the next version comes out.
  - A failed download shows **Retry** and a link to download the installer.
  - *Settings → About* shows when the last check ran, the error of a failed check, and a link to
    the releases.
- **Releases:** `scripts/release.mjs` now publishes through the releases repo's `publish.mjs`. That
  creates the `app-vX.Y.Z` release with the NSIS + MSI installers and signatures, writes
  `app/latest.json` + `app/CHANGELOG.md` and pushes the repo.

## v0.5.1 — 2026-10-16

- **Calmer window buttons.** Minimize, maximize/restore and close are now thin monochrome glyphs
  in soft circles. There is no hover box and no red close button; hovering only darkens the
  glyph. A press squeezes the circle and sends a ripple out of it. Keyboard focus shows an accent
  ring.
- **The code backdrop is back on Home.** The drifting field of faint code glyphs behind the
  greeting returns. It fades out towards the middle so the greeting and composer stay clean, and
  it no longer glows under the cursor. Clicking the background sends a ripple through the
  glyphs: an accent-coloured ring grows from the click and re-rolls the glyphs it passes. Clicks
  on the composer, buttons and suggestions don't start one. With reduced motion, the field stays
  still and clicks don't start ripples. While idle the field redraws about 14 times a second; a
  ripple runs at full frame rate.
- **QA:** `window-buttons.mjs` covers the button styles, hover, the press ripple, the glyph
  field, background ripples and frame cost.

## v0.5.0 — 2026-10-16

- **Projects in the sidebar.** A **Recents | Projects** switch sits above the session list.
  **Projects** groups sessions under their project folder, with the most recently active project
  first:
  - Each folder header shows the session count and opens or closes with a click. The app
    remembers which projects you closed.
  - An open project lists its 5 newest sessions, with **Show N more** / **Show less**.
  - A closed project still shows the session you have open, and its header shows a dot when one
    of its sessions is working, needs you, failed or is unread.
  - On hover, the header shows **New session in this project** and a ⋯ menu: New session, Show
    folder, Collapse all / Expand all.
  - Two projects with the same name show their parent folder to tell them apart.
  - Search opens every project that has a match.
  - Sessions that run in a git worktree are listed under the repository they came from, not under
    a folder named after a timestamp. Forks of those sessions are listed there too.
  - Pinned sessions stay on top.
- **Projects is the default view.** Existing installs switch to it once. **Recents** (by date)
  is one click away and is remembered. The filter menu still offers Project, Date or None.
- **QA:** `projects.mjs` adds a few projects to the QA profile and checks grouping, same-name
  hints, Show more, collapse (kept after a reload), the hover actions, search, New session in a
  project and switching back to Recents.

## v0.4.0 — 2026-10-16

- **Nothing you send is lost when the PC shuts down.** Messages you steer into a running turn or
  queue for after it, images included, are saved with the session until the model has read them
  (aix 2.9 journal). After a crash, a forced quit or a power cut, opening the session shows them
  as **Not sent · 10:42 — aix Code closed first**, each with **Send** and **Discard**. Messages
  that did reach the model before the crash are recognised and not offered twice.
- **Usage like context.** A ring next to the context ring shows the subscription's 5-hour window
  (outer) and weekly window (inner), from the headers Claude and ChatGPT plans send with every
  reply. Its popover has a bar per window and the reset time ("Resets in 2h 9m · 3:31 AM"). It
  is hidden for plain API keys.
- **The window no longer sticks to the cursor.** A drag now starts only once the mouse moves with
  the button held, so a click on the title bar can't glue the window to the pointer anymore, and
  a double-click maximizes. Streamed text and command output are merged for up to 40 ms before
  they reach the UI, and the heavier commands no longer run on the window's main thread, so
  dragging, resizing and typing stay responsive while aix streams.
- **Faster sessions.** Opening a session now lays out the whole transcript without copying it and
  builds only the visible page. A compacted history is no longer cloned on every open. The last
  four stored sessions stay cached, keyed by file version (WAL included). A 9 MB session opens in
  about 15 ms in the backend and 170 ms including render. Each part of the UI now subscribes only
  to the data it shows, so a streamed token no longer re-renders the sidebar, title bar, composer
  and home screen.
- **Axo has its own lane.** Above the composer it walks in a strip of its own, so it never covers
  the task list, queued or steered messages, or the limit band. The lane opens with a short
  animation when there is something above the composer.
- **Smoother UI:**
  - The task dock has a progress bar, a height animation when it collapses (showing the current
    step while closed), task icons that pop when their status changes, a breathing in-progress
    dot and a fading strike-through on finished tasks.
  - Queued and steered messages slide in, and slide out once delivered or removed; image
    attachments show as a count.
  - Cards rise in, and buttons press in.
- **Less rate-limit spam.** A pause is announced once instead of every 30 s (aix 2.9); the band
  above the composer keeps the countdown.
- **QA:**
  - `drag.mjs` checks that a click doesn't start a drag, that press-and-move starts exactly one,
    that a double-click maximizes and that buttons never drag.
  - `polish.mjs` + `polish-restore.mjs` cover the task dock, usage ring, Axo's lane and
    steer/queue, then kill the app mid-turn and check that both messages come back.
  - New `qa_polish` scenario.


## v0.3.0 — 2026-10-16

- **A chat never closes because the connection dropped.** The turn stays open and the working
  line says *Connection lost · Reconnecting in 4s (attempt 3)* with a live countdown and
  **Retry now**; the title bar and the sidebar show *Reconnecting*. Half-streamed text is discarded
  and the answer arrives whole once the API is back, with nothing retyped. (aix 2.8 also fixes
  dropped Anthropic streams ending the turn with "empty response".)
- **Usage and rate limits pause, then resume by themselves.** A band above the composer shows
  *Usage limit reached* (or *Rate limit reached*), the provider and model, a countdown
  (*Resets in 26h* → *4:59* → *Resetting…*) and the reset time (*tomorrow at 9:01 PM*), plus
  **Check now**, **Switch model** (which continues the same turn on the new model) and **Stop**.
  Messages you send meanwhile are held until the limit resets. The session shows *Paused* in the
  sidebar and title bar, the office sits down, and you get a notification when it pauses and when
  it resumes. One quiet *Resumed* line replaces the core's notice at every check.
- **Failed turns get a card with Try again.** It shows a headline, a hint, *Switch model* or
  *Compact session* when they help, and *View details* with the raw error. **Try again** re-runs
  the turn on the same history (aix `/retry`). Only the latest failure is interactive; older ones
  shrink to one line. The sidebar marks the session *Hit an error*.
- **Instant steer.** While aix works: **Enter** sends at the next step, **Ctrl+Enter** sends
  *now* (the reply being written stops and aix reads your message right away), and **Tab** queues.
  Waiting messages get a **Send now** button.
- **Look inside any agent.** Office rows now show each subagent's effort, prompt tokens and cache
  share, output tokens, live tok/s and cost. Click a row (live or finished) to open the
  **agent inspector**:
  - live metrics: input, cache read and write, output, reasoning, context %, speed, tool calls,
    cost;
  - its streamed activity (thinking, replies, tool calls) and the task it was given;
  - its plan;
  - a box to message it at its next step, or instantly.
- **Agents know each other.** Helpers are told who their colleagues are and when someone joins or
  leaves, so they message each other directly instead of relaying through the manager (aix 2.8).
- **The sidebar collapses to a rail.** The width animates, and the rail shows New session,
  Search, Customize and the sessions that need a glance (working, waiting, paused, failed, unread)
  with their state badges and tooltips. The side pane is now an inset card, so its border no longer
  ends abruptly at the title bar.
- **Fixes:**
  - Rewind and fork no longer hit the wrong turn in long, paged sessions: new messages are
    numbered after the session's real turn count.
  - A message that fails to send comes back into the composer instead of being lost.
  - A first turn that fails within milliseconds no longer leaves the session stuck on "working".
  - Shift+Tab cycles the permission mode inside sessions too.
  - The Home `/` menu lists only commands that work there; `/init` and `/review` start a session.
  - Preference changes are saved as patches, so a stale copy can no longer revert e.g. *Agents
    can talk*.
- **Claude Desktop 2.42304 notes:** `docs/claude-desktop/` holds the updated behavioural spec
  (session view, errors, connection and limits). `docs/gap-analysis.md` lists the remaining
  parity backlog.
- **QA:**
  - `scripts/qa/flows/resilience.mjs` covers reconnect, rate limit, usage limit, failed turn and
    a real API outage (the mock is killed mid-answer, then restarted).
  - `inspector.mjs` and `sidebar-rail.mjs` cover the new views.
  - `launch.ps1 -TargetDir` runs a QA build next to your own dev app, which gets its own WebView2
    profile.

## v0.2.0 — 2026-10-15

- **The office.** A new *Office* pane (title bar → building icon) shows the session as a pixel-art
  office: Axo, the manager, at the big desk and a desk per running subagent — each with its own
  critter (the same seed → look as in the terminal app: 11 shapes, hats, glasses, scarves…). Helpers
  walk in through the door, think, type and talk at their desks, walk over to deliver messages, and
  leave when they finish; the room grows with the team. A roster lists what each one is doing
  (model, tools, tokens, time) next to the recent mail.
- **Agents talk to each other** (aix 2.7 `message_agent`): the manager can redirect a running
  helper, helpers can ask a blocking question or share findings, and every note shows up in the
  chat (✉ from → to). The *Agents can talk* switch decides whether helpers may also message each
  other — partitions go up in the office when it's off.
- **Axo lives on the composer.** It walks along the input bar, thinks, types, talks, naps and hops —
  each action a freshly sampled variant (gaze × gesture × bubble × tempo… hundreds per action), chosen
  by what the session is doing — and it reacts to what you do: power-up auras when you raise the
  effort (ultra: golden, with lightning), a "nerf" when you lower it, shades and a ring of fire for
  *Bypass*, a spin for a new model, a moving box for a new folder. Click it for a hop.
- **A cleaner, Apple-like design.** Neutral greys with one accent, a new logo and app icon, sans-serif
  headings, soft rounded controls (buttons, pills, cards, segmented controls), a quiet border sheen
  instead of the rainbow ring, no glyph field or plasma — and much less "aix" branding everywhere.
- **Automatic updates.** aix Code checks its GitHub releases at start and every few hours, shows a
  notification when a new version is out and installs it with one click (signed installers +
  `latest.json`; *Settings → About → Check for updates*).
- **Fixes:** the chat follows new output again (the transcript column could grow instead of scroll,
  pushing the composer off-screen); the Stop button and input row no longer collapse while a turn
  runs (a CSS class collision); the end-of-turn "flicker" is gone; blurred glows no longer get cut
  off; *Accept edits* really accepts workspace edits (aix 2.6.11 core gate); no more console window
  — the exe is a GUI app and child processes (MCP servers, language servers, git…) never flash
  `cmd` windows; earlier thinking shows "Thought briefly" instead of "Thought for 0s".
- **QA without screen scraping:** `scripts/qa` drives a dev build over the WebView2 DevTools
  protocol (DOM checks, console errors, screenshots, screencasts) against the offline mock API, in an
  isolated profile (`AIX_HOME` + the new `AIX_CODE_HOME`).

## v0.1.0 — 2026-10-15

First release of **aix Code**, the desktop app for the aix coding agent.

- **The aix engine, in-process.** The Tauri backend links aix-cli as a library — providers,
  tools, safety rules, MCP, skills, plugins, compaction, subagents and the session stores are the
  same ones the terminal app uses.
- **Code-tab UX** modelled on Claude Desktop (specified by reverse-engineering its code, see
  `docs/reverse-engineering.md`): sessions sidebar with date/folder grouping, pin, rename, archive,
  fork, delete and live working / needs-input / unread states; home screen with suggestions;
  composer with `@` files, `/` commands, `!` shell commands, images, steer (Enter) and queue (Tab).
- **Pills:** environment, folder, branch / worktree, permission mode (Manual, Accept edits, Plan,
  Auto, Bypass), model, effort (auto → max, ultra), context ring with *Compact now*.
- **Transcript:** streaming markdown, thinking, grouped explore calls, diffs, command output,
  approval and question cards, rewind / fork from any message, plan dock.
- **Model picker:** search, favorites, provider rail, metadata badges, and a model & prompt pane
  (context-window override, thinking, fallback, smart subagent model, custom system prompt).
- **Providers & API keys:** presets, validated keys, several accounts per provider, connection
  tests, ChatGPT plan windows and API rate-limit headroom.
- **Usage dashboard:** cost, tokens, cache hits, daily chart per provider, per-model breakdown.
- **Panes:** git changes, integrated terminal (ConPTY / PTY), session info, dev-server preview.
- **Axo**, aix's pixel-art axolotl, plus a motion system (route transitions, aurora composer,
  ultra plasma, staggered lists) that respects reduced motion.
- Long sessions open instantly: the transcript is paged (last 160 items, *Load earlier messages*).
- Sessions written by test suites (provider `mock`) are hidden — the same rule as aix-cli 2.6.10.
