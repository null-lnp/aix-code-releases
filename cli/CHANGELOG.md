# Changelog

## v2.22.1 — 2026-10-28

- **↑ recalls only this conversation's messages.** After `/clear` or `/new`, ↑ still walked the
  previous conversation's messages; now it starts empty and fills with what you send. Ctrl+R still
  searches every prompt you've sent (aix's shared history).

## v2.22.0 — 2026-10-28

- **Ctrl+click opens files in your code editor, at the line.** `file_opener` now defaults to
  opening text files in an installed code editor — VS Code, Cursor, Windsurf or VS Code Insiders,
  the first one found — at the referenced line and column (through its `--goto`, so the file opens
  in the running window). Folders open in the file manager; pictures, PDFs and media in their
  default app. Without an editor, text files open in their default app as before. New value
  `system` keeps the default app for everything.
- **More references are recognised:** `path:12-20`, `path#L12-L20` and compiler-style
  `path(12,4)` open at their first line; paths relative to the repository root work from a
  subfolder, and `a/` / `b/` diff prefixes are dropped. A colon, full stop or bracket after a path
  is no longer part of it.
- **Programs are never run:** a click on an `.exe`, an archive, an installer or an app bundle
  shows it in the file manager instead.
- The hover hint says what a click does: **Ctrl+click: Open in VS Code at line 12**, *Show in File
  Explorer*… `/help` lists Ctrl+click.
- Fixed: clicking a path on Windows passed explorer.exe a `\\?\` path and reported its exit code 1
  as a failure; a `code --goto …` command now finds `code.cmd`.
- Core API: `util::file_links` (`trim_candidate`, `resolve`, `describe`, `open`, `check_opener`,
  `installed_editors`) and `config::file_opener_for` / `user_file_opener` / `set_user_file_opener`.
  Aix Code 0.20.0 uses them for its Ctrl/⌘+click file links.

## v2.21.1 — 2026-10-25

- **Stable input identities across provider/model switches.** Rewind and fork can resolve a
  specific saved input rather than relying on a client's turn counter. Existing histories receive
  deterministic targets, and IDs remain stable through sanitization, reload, and compaction.
- Keep the compaction boundary aligned when sanitization removes thinking/results or inserts
  repaired tool results; post-compaction inputs stay visible and rewindable after provider changes.
- User steers embedded in tool-result messages are counted and rewound individually, preserving
  earlier results/steers and the selected input's images. Repeated text has distinct identities;
  stale or ambiguous IDs are rejected without truncating history.
- `/goto`, `/trim`, forks, image restoration, Esc Esc, transcript rebuild, and input recall share
  the same logical input boundaries. Internal agent mail and tool-generated context are not user
  turns. Metadata IDs are stripped from provider payloads and do not change the wire conversation.
- Aix Code 0.19.1 adds desktop-only stable-target controls, canonical live-input delivery, send/reload
  reconciliation, and serialized history editing around this shared fix. Rewind changes chat
  history only; it never reverts workspace files.

## v2.21.0 — 2026-10-25

- **Notification-driven subagents.** `spawn_agent` returns a task ID immediately by default.
  Continue other work, or finish the current turn when only waiting: completion and failure
  reports arrive automatically and resume an idle session. Active sessions read reports at the
  next safe model boundary, with simultaneous user steering read first in the same next request.
  Explicit `background: false` still requests a synchronous report.
- `task_output` is a nonblocking saved-report/status read. Running agents are not failed tools,
  and the old ten-minute timeout/poll-again loop is removed. Tool and Ultra guidance instruct
  the orchestrator to yield rather than poll or execute wait commands. Background peers notify too.
- Notifications are bounded, scoped to the conversation, and delivered once; reports stay
  recoverable without rerunning agents. Only the manager can collect reports; helpers cannot
  consume the manager's notifications. Stop holds automatic continuation, resets reject stale
  completions, and crashes/cancellation produce interrupted reports. Finished handles are cleaned
  up and helper usage is persisted even when the main agent remains idle.
- Goal/peer-goal loops wait on events without spending model rounds; steering and Stop remain
  responsive. Headless output includes notification-driven follow-ups before exiting.
- Aix Code 0.19.0 adds desktop-only notification notices and session wakeup adapters around
  the same core lifecycle. No private Codex code or polling-based wait routine is used.

## v2.20.1 — 2026-10-23

- **Choose a preferred speed beyond the orchestrator's capabilities.** `/fast` and `/ultrafast`
  now set a shared preference on any model. Every request still clamps independently: preferred
  Ultrafast means Fast on GPT-5.6 Sol and Ultrafast on eligible GPT-6.1 Sol/Astra helpers. Existing
  `speed` settings are preserved, and the preference applies to active helpers as before.
- The header and status output separate the model's actual tier from a higher preference instead
  of hiding the preference or calling an unsupported tier “resting.” Only actual provider refusals
  create cooldowns; model-specific prices apply. A preference change does not restart an active
  orchestrator request when its effective tier is unchanged.
- Aix Code 0.18.1 exposes all preference choices with desktop-only actual/preferred badges and
  pricing hints, including on Standard-only models.

## v2.20.0 — 2026-10-22

- **Live speed and effort changes.** `/fast`, `/ultrafast`, effort controls and Ultra helper-effort
  changes reach active model requests and running subagents, including nested contexts. AIX
  transparently restarts just the provider request, not the turn or completed tool work. Retry
  waits wake immediately, partial output is replaced rather than duplicated, reported usage is
  retained, and stale cache refreshes are cancelled. Already-incurred provider usage may be billed.
- **Codex fast modes remain available.** Send the Codex model/tier routing hint alongside the
  request body. Successful response-tier metadata no longer becomes an inferred five-minute
  Fast/Ultrafast refusal; only explicit provider rejections trigger fallback/cooldown. Usage
  estimates still use reported served tiers when present.
- Aix Code 0.18.0 adds desktop-only long-transcript and streamed-Markdown rendering optimizations.
  Its 1,201-item and 64 KB reply QA fixtures remove the measured long-task stalls without
  truncating saved history or changing the model's context.

## v2.19.1 — 2026-10-22

- **Rewound images retain their format.** Sending or queueing a restored image now detects its
  original PNG/JPEG/GIF/WebP format instead of labelling every attachment as PNG, including images
  originally sent from Aix Code. Existing rewind image tags and original data are preserved.
- Aix Code 0.17.1 restores original attachments alongside text when rewinding, retains live
  follow-up images in chat, and displays bounded cached previews for larger saved screenshots.
  Preview generation is shared; composer thumbnails and chat placeholders are desktop-only UI.

## v2.19.0 — 2026-10-22

- **Free local prediction setup.** `/prediction setup` explains the ~520 MB download;
  `/prediction install` downloads pinned Qwen2.5-0.5B Q4_K_M (Apache 2.0) and llama.cpp (MIT),
  verifies SHA-256 hashes and installs a portable CPU runner. `/prediction status` reports progress,
  `cancel` stops the download, and `free` enables the model after setup. No GPU, API key or
  subscription is required. It uses roughly 0.5–1 GB RAM while loaded and unloads after two idle
  minutes; disabling it or exiting stops the process. History remains the default.
- **Optional ChatGPT-account predictions.** `/prediction chatgpt <provider> [model]` uses that
  provider's active ChatGPT sign-in, never an API key. It consumes plan limits and sends bounded
  recent conversation text to OpenAI, not the unsent draft. One cached next-message prediction
  per conversation update/account, with a request throttle and no paid-provider fallback.
  This uses the existing Codex provider, not OpenAI's private composer prediction service.
- Aix Code 0.17.0 exposes the same choices with desktop-only download/source controls. Tab / Right
  explicitly accepts suggestions; no prediction sends or executes a message. Local model quality
  and speed vary with hardware and are not identical to OpenAI's closed predictor.

## v2.18.0 — 2026-10-21

- **Predictive typing, locally.** Idle composers can show a dim continuation from your prompt
  history after three characters. Tab / Right Arrow accepts without submitting, Esc dismisses,
  and command/file pickers, history recall and waiting-message edits keep priority. Tab while
  working still queues. Aix Code 0.16.0 uses the same engine with an inline ghost-text overlay.
- **Optional local-model inference.** `/prediction local <loopback-url> <downloaded-model>` can
  suggest novel continuations or a next user message from the conversation. History is the
  default and is not an AI model. `/prediction history`, `on` and `off` configure the shared
  user-only setting; repositories cannot opt you in. No model download, ChatGPT subscription,
  private prediction API, paid-provider fallback, tools or automatic submission is involved.
- The predictor rejects remote/authenticated URLs, redirects and cloud-tagged models; it never
  inherits provider credentials/headers. Draft/context/output sizes are bounded and stale work
  is cancelled. Use a small locally hosted model; a local gateway that forwards to cloud is not
  a free local model. This is an original alternative, not OpenAI's closed prediction engine.
- Desktop-only counterpart: visual ghost-text/settings controls; shared matching, inference and
  safety policy live in the core.

## v2.17.0 — 2026-10-21

- **Claude OAuth without installing Claude Code.** `aix login anthropic --oauth` opens a browser
  approval link and accepts the returned authorization code. Each saved Claude account owns its
  refreshable tokens; `/accounts` can add several sign-ins (`i` still adds an API key).
  Proof keys remain private when copying an approval link; CSRF state is generated independently.
  `aix login openai --oauth` explicitly selects ChatGPT sign-in. Aix Code 0.15.0 exposes both flows.
- **Account failover and live switching.** Claude subscriptions join ChatGPT, Google and API-key
  account rotation. Rate limits and exhausted API credits try another saved account of the same
  provider and authentication/billing mode before waiting or failing. Partial streams are reset
  before retrying, refreshed credentials stay attached to their account, and active-account changes
  are picked up by existing clients. Subscription requests never silently switch to paid API keys.
- **`/import-codex`** imports personal/project Codex and .agents skills, Codex prompts and compatible
  cached plugins. Existing aix content is kept; credentials are not imported. `/resume-codex`
  continues to import conversations. Both commands are available in Aix Code too.
- **A model switch resumes a paused turn** on the new model and the existing history without
  dropping queued follow-ups. Pauses remain scoped to the provider/model that hit its limit.
- Desktop counterpart: Aix Code adds a System/Full/Reduced animation setting for its CSS and
  canvas renderers; the terminal's existing motion preferences are unchanged.

## v2.16.2 — 2026-10-20

- **Model lists are ordered.** `/model`, `/fallback` and the peer setup used to show each
  provider's models in whatever order its API returned them, so a model the ChatGPT catalog
  doesn't list (GPT-6.1 Sol) ended up after everything else. Now each provider's models are grouped
  by family, newest version first, then the bigger tier (Astra / Opus, then Sol / Pro, the plain
  model, Terra / Sonnet, Luna / Flash / Haiku, Mini / Lite). Models without a version, like
  `gpt-daybreak-blue-latest`, close their family. Core: `config::sort_models` (Aix Code 0.14.2 uses
  it too).

## v2.16.1 — 2026-10-20

- **Axo sleeps while a rate or usage limit pauses the session**: the status line and the working
  row show `ʚ-ᴗ-ɞ` with a drifting `z` (gills still, no blinking) until the limit lifts. A pending
  approval or question still takes precedence. (Aix Code 0.14.0 ships the desktop side: Axo naps on
  the composer and walks into the office through a door.)

## v2.16.0 — 2026-10-20

- **Sign in with Google (Antigravity), including Gemini 4 Argon.** New built-in provider
  `antigravity`: `aix login antigravity`, `aix accounts add antigravity`, `/accounts` and
  `/add-provider` open Google's sign-in in your browser and use the models Google's Antigravity
  IDE serves — **Gemini 4 Argon** (the default), Gemini 3.8 Flash, Gemini 3 Flash / Flash Lite,
  Claude Opus / Sonnet 5.5 and 4.6, GPT-OSS 120B. Several Google accounts work like other
  providers' accounts (a quota error pauses until the reset Google reports, or switches to the
  next account). Effort maps to Gemini's thinking levels (Gemini 2.5 to a thinking budget), thought
  signatures go back only to the model that wrote them, tool schemas are adapted to what the
  gateway accepts (recursive `$ref`s bounded, free-form objects kept usable on Claude), and
  malformed Gemini tool calls are asked for again. The full sign-in link is shown (wrapped) for
  machines without a browser, Esc cancels a waiting sign-in, and removing a Google account revokes
  it. **Unofficial:** it uses the Antigravity IDE's sign-in; Google may restrict accounts that use
  it outside Antigravity. `AIX_NO_BROWSER=1` prints sign-in links instead of opening a browser.
- **Edit and copy waiting messages.** Alt+↑ or Ctrl+↑ on an empty composer takes the last
  waiting message (steer or queued) back to edit it, with its images; it isn't sent meanwhile and
  stays in the crash journal. Enter puts it back the way it waited, in its place (an instant steer
  stays instant); Esc puts it back unchanged without stopping the turn; Ctrl+U drops it. Alt+C
  copies it, pasted blocks expanded. Cancelling an edit never sends anything.
- **Ultra mode: choose the subagents' effort.** `/ultra subagents low|medium|high|xhigh|max`
  (default xhigh, clamped to each subagent's model; also while a turn runs), or Tab on Ultra in
  the `/effort` picker and ←/→. Saved as `tools.agents.ultra_effort` in ~/.aix/settings.json —
  or in the project's `.aix/settings.json` when it sets its own. Running sessions use it for
  their next subagents; the header shows `ULTRA · subagents <level>` on wide terminals.
  `/ultra on|off` work too.
- **Scrolled-up history stays put** while a reply streams in below; the view follows the newest
  output only at the bottom.
- The OAuth callback pages (ChatGPT and Google) escape what they show, and requests that don't
  belong to the running sign-in are ignored instead of aborting it.
- `credentials.json` / `accounts.json` keep fields written by newer aix versions. Versions before
  2.16.0 still drop the `google` field when they rewrite the file.
- Core API for UIs: `TurnInbox::edit_steer` / `put_back_steer`, `pending::edit`,
  `Session::load_with_progress`, `config::save_ultra_effort` / `ultra_effort_in`, and a
  process-wide lock around settings writes (Aix Code 0.13.0 uses them). The desktop app's new
  "Loading session…" progress has no TUI counterpart: the TUI loads a session before it draws.

## v2.15.1 — 2026-10-20

- **`/compact` while aix works is no longer ignored.** It used to wait silently in the composer;
  now it schedules a compaction the running turn (or goal round) does before its next request, then
  goes on with the compacted history ("Compacting at the next step…"). A compaction scheduled
  this way never runs after a turn's final reply (that would replace the result `/review` and the
  peer goal read): the job ends and `/compact` starts. Esc cancels it; asking twice compacts once,
  and a request made while a compaction runs is satisfied by it.
- **Messages typed during a compaction wait for it.** The status reads *compacting* with its
  timer and the pending lines say *sent after compaction*. When the compaction fails or is
  stopped they are **not** sent on the uncompacted history: they wait in the queue (Enter on an
  empty line sends them anyway). Steers a finished job never read are now sent as the next turn
  instead of sitting in the "Steering…" preview forever; office mail and notes stay out of it.
- **`/retry` after a failed `/compact` compacts again** (core `run_retry`) instead of continuing
  on the history the compaction was meant to shrink.
- **Sturdier compaction:** the summary request's output cap is sized to fit next to the history
  (the old cap could make input + max_tokens overflow a nearly full window);
  `input length and max_tokens exceed context limit` counts as a context overflow and
  `model_context_window_exceeded` trims the oldest history and asks again; reconnects and
  rate-limit waits during a compaction are shown instead of an endless "Working"; a stopped
  compaction is reported as interrupted, not failed.
- Core API for UIs: `CoreState::request_compaction` / `compaction_requested` /
  `take_compaction_request`, `last_turn_kind`, `last_compaction_failed`, `record_interrupted`,
  and `agent::run_retry` (Aix Code 0.12.1 uses them the same way).

## v2.15.0 — 2026-10-19

- **/goal works like Codex's goals.** Near a full context the model gave up or gave shallow
  answers instead of working on the goal. The goal loop now follows codex-rs `ext/goal`:
  - Every round starts with Codex's continuation prompt: the objective (round 1 as the goal
    message itself, later rounds as a "Goal round N" reminder that restates it), keep the full
    objective and don't redefine success around a smaller task, work from evidence, a
    no-progress check (status restatements and unexecuted plans are no progress), a
    requirement-by-requirement completion audit, and a blocked audit.
  - The model ends the goal with the new `update_goal` tool — `complete`, `blocked` (the same
    blocker three rounds in a row) or `paused` (only when you ask) — and reads it with
    `get_goal`. Both tools exist only while a goal runs. A round that ends with the goal still
    active simply starts the next one. This replaces the `GOAL: ACHIEVED` / `NOT_ACHIEVED` final
    line: a reply that merely says it's done settles nothing.
  - `goals.max_goal_token_budget` (Codex's setting; none by default): the tokens a goal may
    spend (uncached input + output, subagents included). Only with a budget does the model see
    token numbers; when it's spent, one last round wraps up (Codex `budget_limit`) and the goal
    stops.
  - aix keeps its safety nets: three rounds in a row without an answer stop the loop,
    `goal_max_rounds` (0 = unlimited), refusals and provider errors stop it, Esc stops it.
- **The model is told nothing about its context window** (as in Codex). The system prompt's
  "when you run out of context, the conversation is automatically summarized…" paragraph is gone
  (a test keeps context, compaction and tokens out of it), and `spawn_agent` no longer mentions
  a "fresh context window". After a compaction the summary's own prefix explains it, as in
  Codex. Note: the Anthropic API itself tells Claude Sonnet 5 / 4.6 / 4.5 and Haiku 4.5 their
  token budget; Opus 4.7+, Opus 5.x and Fable don't get it.
- **A reply cut off by a full context window is no answer.** Claude 4.5+ accepts a request
  whose input plus output cap exceed the window and stops with `model_context_window_exceeded`
  when it fills up. aix took that cut-off reply as the turn's final answer — a /goal round near a
  full window ended with a truncated, shallow reply and never compacted. Now the partial reply
  is dropped, the history is compacted once (reactively, like any overflow) and the request goes
  out again; still full right after → the turn stops with "aix ran out of room".
- The "Heads up: long sessions and multiple compactions…" warning after every compaction is gone
  (Codex dropped it too); the compaction notice remains.
- An aborted `/goal` (Esc, or the desktop app's hard stop) no longer leaves the goal — and its
  tools — behind for later turns; the status bar's goal chip goes on Esc too.
- A resumed session shows a goal turn as `🎯 goal: …` instead of the whole goal prompt.
- Aix Code v0.12.0 follows (goal rounds in stored sessions, the /goal help).

## v2.14.0 — 2026-10-19

- **`/goal` no longer stops while the goal isn't achieved.** A round that came back with no
  answer — an empty response (Claude occasionally ends a turn with nothing, or a proxy drops the
  stream), or a reply that kept hitting the output-token limit — ended the whole loop with
  "goal loop stopped in round N: … — the goal is not achieved". Such a round is now no verdict:
  the loop asks again from where the work stands ("round N: the model returned an empty response
  — asking again (1/3)"; for the output limit it asks for smaller steps), and only
  `goal::MAX_STALLED_ROUNDS` (3) of them in a row stop it — a stuck model or connection must not
  loop forever. A cut-off reply that happens to end with `GOAL: ACHIEVED` still never counts.
  Provider errors, safety refusals, Esc and `goal_max_rounds` stop it as before (a stalled round
  counts toward the cap).
  - The turn layer no longer reports these two ends itself: `TurnEnd::Empty` /
    `OutputExhausted` carry their notice and `run_turn_inner` shows it, so every other caller
    (turns, workflows, reviews, peers, subagents) behaves exactly as before. The empty-response
    notice now tells a model that answered nothing apart from a stream that kept dropping (it
    always said "after 0 retries").
- **Questions and the subagent prompt answer themselves.** Both waited forever, so an
  unattended run (a `/goal` loop, a long task) could hang on a prompt nobody was there to answer.
  - `ask_question_to_user` waits `tools.request_user_input.timeout_secs` (default 300 s), then
    tells the model the user did not reply and to go on with its best judgment and state its
    assumption. This replaces the TUI's yolo-only five-minute auto-answer: it now lives in the
    core and applies in every mode.
  - "Launch a subagent?" waits `tools.agents.consent_timeout_secs` (default 120 s), then counts as
    No. A No — given or by timeout — now holds for the rest of the request: later (or parallel)
    spawns of it are refused without asking again. A prompt that went away unanswered because the
    turn was stopped does not count.
  - `0` waits as before. Front-ends learn the deadline from `CoreEvent::PromptDeadline
    { request, until }`, sent right before the prompt (`request`: the approval's id, None for the
    question that follows); when the core stops waiting it drops the prompt's receiver.
  - **TUI:** the question modal's title counts down (`⏱ 4:59 left · then the agent decides`) and
    the subagent prompt shows `⏱ 1:59 left · then No — the agent works without subagents` — dim,
    amber in the last minute, red at the end. A prompt the core gave up on closes on the next tick
    with a line saying what happened; a custom answer being typed stays in the input box.
- Aix Code shows the same countdown on its question and permission cards (app v0.10.0).

## v2.13.0 — 2026-10-19

- **`/fast` and `/ultrafast`.** A new core module, `agent::speed`, knows which providers and
  models offer a faster response tier and asks for it: Anthropic fast mode (`speed: "fast"`) on
  Claude Opus 5.5, and on Opus 5 / Opus 4.8 behind the `fast-mode-2026-02-01` preview beta;
  OpenAI and Codex `service_tier: "priority"` (Fast) on GPT-5.6 / GPT-6 and `"ultrafast"` on
  GPT-6.1 Sol and GPT-6 Astra. A ChatGPT plan's live model catalog (`additional_speed_tiers`,
  `service_tiers`) overrides the built-in table, with the plan's own notes ("2x speed, increased
  usage"). Proxies and compatible servers never get the field unless their provider entry opts in
  with `"fast_mode": true` (`false` hides the tiers).
  - **TUI:** `/fast [on|off|status]` and `/ultrafast [on|off|status]` toggle the tier, saved per
    project (`speed` in settings.json; Codex's `service_tier` key is read too). Both commands are
    only listed in the palette and `/help` where the model offers the tier. The header shows
    `⚡ FAST` (amber) or `⚡⚡ ULTRAFAST` (red), dimmed with the time left while the tier rests, and
    `/status` has a Speed row with the price (`Fast · 2× price ($8/$40 per MTok)`).
  - **Refusals fall back by themselves.** A request the provider refuses at a faster tier (fast
    capacity exhausted — a 429 —, the tier not enabled for the account, not offered for the model)
    goes out again right away one tier slower, without pausing the session or switching accounts,
    and that tier rests for `fast_mode_cooldown_ms` (default 5 min) so an account pays for the
    refusal once. A response the provider served slower than asked (`usage.speed`,
    `service_tier`) rests the tier the same way. Front-ends hear `CoreEvent::SpeedChanged` plus a
    transcript line.
  - **Costs include the premium.** `Usage.surcharge_usd` carries what faster tiers added (2× the
    Standard price for Fast, 6× for Ultrafast, priced per response at the model that served it);
    `Usage::cost` includes it and `/status` shows the share.
  - A running job picks up `/fast` at its next request (`CoreState::set_speed`), subagents
    included where their model offers the tier.
- **Goal rounds are events.** `/goal` and `/peer-review-goal` send `CoreEvent::RoundStarted
  { round }` (1-based) before each round's prompt. The TUI header shows `⚑ goal · round n` while a
  goal loop runs and `/status` a Goal row; Aix Code draws its goal band and round markers from it.
- **Mock API:** `dev/mock_api.py` echoes the tier a request asked for (`usage.speed`,
  `service_tier`), and a reply's `served_speed` can report a slower one.
## v2.12.0 — 2026-10-16

- **A finished plan clears when the next task starts.** The plan (`update_plan` / `todo_write`)
  used to outlive its work: after every step was done, the next message brought the old
  checklist back in the TUI dock and in Aix Code. Now a regular user turn first clears a plan
  whose steps are all completed (`agent::tools::plan::clear_finished_plan`): the todo list, the
  plan state and the saved session plan are emptied and an empty `PlanUpdate` tells the
  front-ends to drop it. An unfinished plan stays, since the new message may continue it.
  - **TUI:** the dock also hides a finished plan as soon as the turn is over, and a resumed
    session no longer shows a plan that was finished before a later message (`last_plan`).
  - **`aix exec --json`:** an empty plan update with no open todo list emits nothing.
- **Front-ends can tell the model what they render.** A new context section,
  `<display_capabilities>` (`agent::context::display`), is sent once per session (and again only
  when it changes) by front-ends that register themselves with `display::set_client`. Aix Code
  registers as the desktop client: the model learns that ```mermaid blocks render there as
  interactive diagrams (pan, zoom, full screen) and draws flowcharts, architecture and dependency
  graphs, sequence/state/class/ER diagrams, timelines, gantt charts, mindmaps and simple charts
  as mermaid instead of ASCII art. The terminal sends nothing, so TUI prompts are unchanged; a
  desktop session resumed in the terminal gets a one-line notice that diagrams no longer render.
  The system prompt stays byte-identical for every client.
- **Aix Code** is the desktop app's new name (it was "aix Code"); comments and docs follow.
## v2.11.0 — 2026-10-16

- **Per-response tok/s history in the core meter.** `agent::throughput::Throughput` now keeps the
  last 120 responses (`HISTORY_CAP`) as `ResponseSample`s: output tokens, request time, time to
  first token (`ResponseStarted` → first streamed delta), generation speed and the model that
  produced it (`set_model`, `ModelSwitched`). Subagent meters are labelled with their model too.
  - **Generation speed** is tokens over the request time minus the time to first token. It uses
    the whole request time when nothing streamed, when less than 500 ms of generation remains
    (`MIN_GENERATION`), or when the model reasoned without streaming its thinking (those hidden
    tokens were generated before the first delta).
  - **Very short requests:** requests under 250 ms (`MIN_SAMPLE`) count toward the average but
    leave no sample, so a reply served in milliseconds can't read as thousands of tok/s.
  - **`Throughput::snapshot()`** returns everything in one serialisable value (camelCase JSON), so
    the TUI and aix Code show identical numbers: live rate, average, peak, `sample_average` (the
    samples' token-weighted generation speed), streaming state, streamed tokens and the samples.
- **Header sparkline.** On wide terminals (120+ columns, when the model and cost still fit) the
  header shows the last 8 responses' speeds after `avg N.N tok/s` as a dim `▁▂▃▄▅▆▇█` sparkline,
  from the second response on.
- **The history survives a model switch.** Picking another model (or a router/fallback switch)
  still starts a fresh average, but keeps the samples (`Throughput::model_changed`); `/clear`,
  `/new` and resuming a session reset everything as before.

## v2.10.0 — 2026-10-16

- **Updates come from the public releases repository.** On the default channel aix reads
  `cli/latest.json` from [null-lnp/aix-code-releases](https://github.com/null-lnp/aix-code-releases)
  first (version, plus per platform a prebuilt binary's URL, minisign signature and SHA-256); only
  when it cannot be read does it fall back to the source repository (raw `Cargo.toml`, then `git`).
  Builds from a source checkout, which follow their Git branch, keep reading that branch.
- **Signed prebuilt updates.** With a binary for this platform (Windows x64 for now), **Update now**
  and `aix update` download it, verify its signature against the public key built into aix (the
  same key as aix Code's updater), that it was signed as an aix release binary (not another
  product's file) and its SHA-256, check that it reports a newer version, then swap it into place
  and restart as before. A binary that fails a check is refused; no Cargo or Rust is needed.
  Other platforms still rebuild with `cargo install --git`.
- **Updates in place wherever aix lives.** A prebuilt binary replaces the running `aix` in any
  location, not only a Cargo install (a source checkout's `target/` build is left alone), so the
  launch prompt and the "restart aix to install it" notice now apply to those installs too. The
  update cache remembers the binary; caches from older versions still load.
- `scripts/release.mjs` builds the release binary (with no Git branch recorded, so it follows the
  public manifest), signs it with the updater key and publishes it through the releases
  repository's `publish.mjs` (`--no-build`, `--releases <dir>`, `--dry-run`).

## v2.9.0 — 2026-10-16

- **Nothing you send is lost in a crash or power cut.** Steers waiting for the next tool boundary
  and follow-ups queued for after the turn, images included, are journaled on the session
  (`Session::pending_input`, saved with it) until they reach the history:
  - a steer leaves the journal in the same save that records the message it rides in;
  - a queued follow-up leaves it when the turn it starts records its input.

  After a restart, whatever never reached the model comes back queued, with a notice; Enter on
  an empty line sends it. Anything already in the history is recognised and dropped. Core:
  `session::pending` (`journal`, `settle`, `sending`, `Session::restore_pending`).
- **Subscription usage windows.** The 5-hour and weekly allowances of a Claude subscription
  (`anthropic-ratelimit-unified-5h/7d-*` headers) and a ChatGPT plan (`x-codex-primary/secondary-*`)
  are read from every response (`api::plan_usage`) and carried in `TokenCount`
  (`TokenUsageInfo::rate_limits`). The footer shows `5h 42% · wk 18%` next to the context gauge
  (wide terminals).
- **One rate-limit notice per pause.** A pause is announced once, by the first request it stops;
  the 30-second re-checks only update the banner and countdown, so the transcript no longer gets a
  new "Rate limit on … paused" line every 30 s.
- `Session::conversation_iter()` / `conversation_len()` read a compacted history without cloning it.
- Dev: the mock API accepts `reply.headers` (extra response headers).

## v2.8.0 — 2026-10-16

- **Instant steer.** `Ctrl+Enter` while a turn runs sends the message *now*: the reply being
  written stops (its visible text is kept), and the model reads your message right away instead of
  at the next tool boundary. `Enter` on an empty line upgrades messages already waiting the same
  way. Core: `TurnInbox::steer_now` / `deliver_now`. A reconnect wait or a rate-limit pause also
  yields to an instant steer.
- **Retry now.** `Ctrl+G` cuts a reconnect backoff short and checks a rate-limited provider
  immediately instead of at its next 30 s check. It reaches subagents too, and the reconnect notice
  and the pause banner show the key. Core: `CoreState::retry_now`, `RateLimitGate::check_now` /
  `subscribe`.
- **Switching models unblocks a paused chat.** Rate-limit pauses are now per provider/model: only
  requests to the limited model wait, and a chat on another model goes ahead.
- **A dropped connection always reconnects.** The Anthropic provider treated a connection that died
  mid-answer as a finished response (half or empty), so the turn ended with "empty response"
  instead of reconnecting. It now fails with the transport error, and the agent waits and resends,
  like the OpenAI and Codex providers.
- **`/retry`** samples again on the current history after an error or an interrupted turn.
- **The office talks.** Subagents now learn who their colleagues are:
  - their brief lists who is at work;
  - every employee gets a one-line note when a colleague joins or leaves (low priority: it never
    reopens a finished reply);
  - `message_agent(to: "?")` lists the staff with tasks and models, and so does the error for an
    unknown recipient.

  **`/tell <name> <text>`** messages one running subagent (`/tell!` interrupts its reply). Core:
  `Office::hire_with`, `roster`, `send_from_user`.
- **Full subagent telemetry.** The agents panel shows the cache share and live tok/s next to the
  token counters. `SubagentStatus::telemetry()` gives front-ends input, cache read, cache write,
  output and reasoning tokens, context size, live and average tok/s, and cost. The tok/s meter
  moved into the core (`agent::throughput`), so the TUI and aix Code compute it the same way.

## v2.7.0 — 2026-10-15

- **The agent office** — the main agent is the manager, running subagents are its employees, and
  they can talk: the new `message_agent` tool delivers a short note (to an employee by name,
  `"manager"` or `"all"`) that the recipient reads at its next step as an `<agent_message>`.
  The manager can redirect or unblock a helper mid-run; helpers can ask a blocking question or
  share an early finding. Every note appears in the chat as `✉ from → to: …` and in the helper's
  inspect log; aix Code animates them in its pixel office.
- **`/agent-chat [on|off]`** — whether helpers may also message each other (on by default). Off,
  they only report to the manager; the manager still reaches everyone.
- Subagents are told about the office in their brief; `core_ext::CoreEvent::AgentMail` carries the
  notes to UIs (forwarded from helpers by the bridge).

## v2.6.11 — 2026-10-15

- **Accept edits** — a new safety mode between asking for everything and yolo: file edits
  (`edit_file`, `write_file`, the minified variants, `apply_patch`) whose every target is inside
  the workspace run without a prompt; deletes, edits outside the workspace or inside `.git`,
  commands and network access still ask. `/accept-edits` toggles it in the TUI; it is aix Code's
  "Accept edits" permission mode (which previously still prompted for every edit).
- **No console windows from GUI hosts** — MCP servers, language servers, formatters, `git`,
  skill commands, the shell tool, `taskkill` and the browser launcher now spawn with
  `CREATE_NO_WINDOW` (new `process::NoConsoleWindow`), so aix Code no longer flashes `cmd`
  windows. Output is still captured through pipes; nothing changes in the terminal.

## v2.6.10 — 2026-10-15

- **No more `turn 0: xxxx…` sessions** — the compaction tests built their 90-turn fixture in
  the working directory and `run_compact` saved it, so every `cargo test` left a fake session
  (model `compact-test`, provider `mock`) in the repository's own `.aix/sessions`. The
  fixture is now ephemeral and never touches disk.
- Session listings (`/resume`, `aix resume`, the store API) skip test-suite sessions
  (provider `mock`) unless every session is requested — the same rule aix Code applies.
- `AGENTS.md` is now the project memory (`AIX.md` points to it) and adds the counterpart rule:
  changes to aix-cli and aix-code-app are mirrored in the other app whenever they apply.

## v2.6.9 — 2026-10-15

- **/goal keeps going until the goal is achieved** — ending a round no longer
  risks ending the goal: each round is judged by its own final response, taken
  before any post-turn compaction can replace the history, never by an older
  assistant message.
- Only an exact `GOAL: ACHIEVED` on the final nonblank line, outside code fences
  (an unclosed or mismatched fence covers the rest of the reply), counts as
  success; markdown wrappers must be balanced. Earlier, qualified, quoted,
  bulleted or fenced positives (`GOAL: ACHIEVED would be wrong.`,
  `GOAL: ACHIEVED? No …`, `GOAL: ACHIEVED -`) continue the goal; `NOT_ACHIEVED`
  spellings keep working. `/peer-review-goal` parsing is unchanged.
- Continuation prompts keep the original objective intact and ask for the next
  concrete action from the current state. Esc stops before another round starts;
  provider errors, safety refusals, empty streams and an exhausted output budget
  stop the goal as failed, without a duplicate error.

## v2.6.8 — 2026-10-08

- **MCP images reach the model** — preserve image-only and mixed text/image tool
  results as inline image attachments instead of replacing pixels with a text
  placeholder. Text, resource and structured metadata remain available.
- Validate supported image MIME types, base64 and dimensions; bound each result
  to eight images and 20 MiB of decoded image data. Invalid attachments produce
  explicit notices without disguising a successful operation as a failed action
  that should be replayed. Failed tool results do not attach images.
- This client-side fix takes effect in a newly started AIX process; existing
  running sessions are not restarted automatically.

## v2.6.7 — 2026-10-07

- **YOLO question timeout** — unanswered interactive agent questions automatically
  reply after five minutes with "user did not respond, do whatever you find best"
  while `/yolo` is enabled. The prompt closes and the automatic answer is shown
  in the transcript. Normal mode still waits indefinitely; manual answers,
  skipping, cancellation, and approval prompts retain their existing behavior.

## v2.6.6 — 2026-10-06

- **Windows compiler-crash installation workaround** — add `dev/install-windows.ps1`
  to install locked dependencies with one Cargo job on logical CPUs 0–1. The limit
  applies only to the build process tree, not the installed application's runtime
  or system-wide settings. Compiler and installation failures remain visible.
- Explicitly disable all release LTO with `lto = "off"`; Cargo's default `false`
  still enables local ThinLTO. Keep release optimization and debugging symbols.
- Document `STATUS_HEAP_CORRUPTION`, executable-in-use errors, and release-only
  verification. Compiler crashes in unrelated dependencies are not TPS source errors.

## v2.6.5 — 2026-10-06

- **Always-visible average TPS** — reserve header space for `avg N.N tok/s`,
  including idle, waiting, and narrow-terminal states. Before the first measured
  response, show `avg — tok/s` rather than hiding the counter.
- Average provider-reported output tokens over the total duration of completed
  requests, including request latency but excluding tool, idle, and retry waits.
  Keep the average across turns and cancellation; reset on model/session changes.
  Measurements start fresh when AIX launches and update after each response.
- Color the counter red below 20 tok/s, amber from 20 to under 50, and green at
  50 or above. The placeholder is dim; the numeric label remains readable without color.

## v2.6.4 — 2026-10-06

- **Live TPS counter** — the header shows output tokens per second for the current
  model request, with `~` marking a live text-based estimate. Provider-reported
  output tokens finalize the rate, which stays visible after the response ends.
  Timing includes request latency but excludes tool execution and retry waits.
  Retries, cancellation, new turns, and session changes clear stale measurements;
  the counter fits the available terminal width without displacing the state pill.

## v2.6.3 — 2026-10-05

- **Correct Debian network seed** — emit lowercase colon-separated MAC addresses
  as required by cloud-init, while retaining Hyper-V's original adapter identity.
  Add regression coverage for the generated static IPv4 network configuration.
- **Complete sandbox uploads** — close helper stdin after writing so archive,
  binary, and project transfers receive EOF instead of hanging until timeout.
  Add a real-process regression test and identify setup stages in error messages.
- Initialize the guest install directory with the guest user's ownership so Cargo
  can write its installation metadata without requiring a root build.
- Correct the Windows smoke test's SSH argument quoting and verify the live guest
  build, project round-trip, host-conflict checks, HTTPS, and host-network denial.
- Document VPN local-network restrictions, including Mullvad LAN sharing, separately
  from Windows Firewall rules. AIX never changes VPN settings automatically.

## v2.6.2 — 2026-10-05

- **Actionable sandbox connection errors** — SSH socket-access denials now stop
  immediately with policy-review guidance instead of retrying until the boot timeout.
  They are distinguished from guest authentication failures and temporary boot errors;
  no firewall rules, SSH trust checks, or VM isolation settings are weakened.
- Preserve incomplete setup state and clarify that resetting/re-downloading Debian
  does not fix blocked SSH connectivity. Normalize helper diagnostic line endings
  without allowing unsafe terminal controls.

## v2.6.1 — 2026-10-05

- **One-command sandbox startup** — the first interactive `aix --sandbox` launch
  explains the default Debian VM setup and asks for approval, then provisions it and
  continues the original session automatically. Guest sign-in is prompted inline
  when needed; separate setup and shell commands are no longer required.
- Setup still requires explicit consent even with `--yolo`. Noninteractive launches
  require pre-provisioning, and existing invalid, incomplete, or orphaned sandbox
  state is never automatically overwritten or reset. There is no host fallback.

## v2.6.0 — 2026-10-05

- **Experimental managed Debian VM sandbox** — `--sandbox` routes interactive, `exec`, and `resume`
  sessions into a headless Hyper-V guest before loading host project configuration.
  Explicit setup verifies Debian image checksums, provisions a private filtered NAT
  network, pins SSH host keys, and builds the bundled matching AIX source in Linux.
- **Reviewed project transfer** — `sandbox import`, `diff`, and `apply` operate on
  separate copies, exclude known secrets/configuration, reject unsafe paths and links,
  and detect host edits before write-back. No project hooks execute during host import.
- **Persistent and fail-closed** — stop/reuse the guest disk, inspect status, or explicitly
  reset all guest state. `--yolo` does not remove VM isolation. The initial backend is
  Windows x86-64/Hyper-V only; there is no automatic host or WSL fallback.

## v2.5.2 — 2026-10-02

- **Automatic provider recovery** — Codex overloads, backend stream failures, transient HTTP
  errors, and dropped connections retry with capped backoff until recovery or interruption.
  Invalid requests, authentication, billing, and context-limit errors still reach their existing
  recovery paths instead of retrying forever. Completed tool results are not replayed.
- **Live rate-limit recovery** — paused chats recheck the pending request every 30 seconds (or
  sooner at reset), so applying a banked reset resumes work without a manual restart. Only one
  early probe runs at a time; fresh limits update the reset estimate. The UI shows separate
  reset and next-check countdowns, and Esc still interrupts without losing saved history.

## v2.5.1 — 2026-10-01

- **`/cache` opens a settings panel** — the two switches (warming, miss notices) with what caching
  has already saved shown above them, since the hit rate and the miss cost are exactly what decide
  whether warming is worth enabling. `space` or `←→` changes the value under the cursor and saves
  immediately; `Esc` closes. When the session has actually lost money to expired entries, the panel
  says so and names the setting that prevents it — and stays quiet when it hasn't.
- `/cache status` keeps the text report, and `/cache warming idle` / `/cache notices on` still set a
  value directly. `/cache` and `/router` now behave the same way: bare command opens a panel,
  `status` prints, args set.

## v2.5.0 — 2026-10-01

Caching and routing now report what they are doing instead of working invisibly.

- **Cache savings in the header** — a green `−$1.40 cached` next to the running cost: what the bill
  would have been without the cache. Shown beside the number it reduced, dropped first on narrow
  terminals, and absent when there is nothing to report.
- **`/cache` reports savings, not just losses** — tokens read from cache, the hit rate as a
  percentage of prompt tokens, and dollars saved, for this session *and* for every session in the
  project (with a net figure once misses are subtracted). A fresh session always looks bad in
  isolation — its first turn is a cache write by definition — so the project line is the honest one.
- **`/router status` reports what routing did** — how many sessions were classified, the
  standard/complex split, and which model served how many. That split is how you tell whether
  routing is earning its keep: mostly `standard` means the cheap model is doing the work.
- Both are **derived from the saved sessions** rather than kept as counters, so they cannot drift
  from what actually happened — the same approach as `aix stats --tools`.
- Removed the `assertion_line:` churn artifact from the seven TUI golden snapshots, so future
  snapshot diffs show only real changes.

## v2.4.0 — 2026-10-01

- **`/router` is a setup wizard** — three steps with your real model catalog in front of you: how to
  decide (`classifier` / `length` / `off`, each with a one-line explanation), then the cheap model,
  then the strong one. Type to filter, `Esc` steps back one stage instead of discarding the wizard,
  and choosing `off` skips the model steps. Configuring routing no longer means knowing the syntax
  and the model ids by heart.
- The wizard opens on whatever mode is current, so on a fresh install `Enter` confirms `off` and
  changes nothing — routing still never turns itself on.
- `/router status` keeps the text report (mode, classifier, targets, and this session's decision);
  `/router <mode> <cheap> <strong>` still works for people who prefer typing.

## v2.3.2 — 2026-10-01

- **`/router` takes the two target models inline** — `/router classifier claude-sonnet-5-5
  claude-opus-5-5` configures the classifier, both targets and the mode in one command. Previously
  `/router classifier` auto-adopted the free jev model and then refused with "set
  core.router.standard_model in settings.json", which left routing off and sent you to a JSON file
  for the one thing aix couldn't guess. Routing is now reachable entirely from the TUI.
- **The "nothing to route to" message is a command you can run** — it suggests your current model as
  the cheap side and the provider's configured `smart_model` as the strong one, instead of naming
  settings keys.
- One or three model arguments is now a clear error rather than a silent guess.

## v2.3.1 — 2026-10-01

- **Fixed: ChatGPT-plan models vanished from `/model` at random** — most visibly `gpt-6.1-sol`. The
  Codex backend's live catalog marks staged-rollout models `visibility: "hide"`, and aix filtered
  those out whenever the catalog loaded, falling back to its full static list only when the fetch
  *failed*. The result was exactly backwards: the model appeared when the network broke and
  disappeared when it worked, which reads as flakiness.

  `visibility` is a merchandising flag, not an entitlement — the backend still serves those models,
  and `/model gpt-6.1-sol` (typing the id) always worked because that path never consulted the
  catalog. They were usable but undiscoverable. The picker now lists the live catalog first, then any
  statically-known model the catalog omitted or hid, so what you can select matches what the backend
  accepts. A model the backend genuinely refuses now fails at request time with the provider's own
  error instead of silently not existing.

## v2.3.0 — 2026-10-01

Routing is now visible: you can see whether it is on, what it decided, and which model served each
turn.

- **Router chip in the header** — `⇄ router` when routing is on but nothing is classified yet,
  `⇄ standard 0.08` or `⇄ complex 0.92` once decided (amber for complex, the branch that costs
  money). Nothing is shown when routing is off, so a default install sees no new chrome.
- **Each turn's closing rule names the class that chose the model** —
  `✓ 48s · claude-opus-5-5 · ⇄ complex 0.92 · $0.084`. The model was always there; now it is
  explained rather than merely stated.
- **The decision is persisted and survives resume** — class, P(complex) and mode are stored on the
  session, so `/router` and the chip can still explain a conversation hours later. `/clear` and
  `/new` reset it, so the next first message is classified afresh.
- **`/router` reports the live decision** — `this session: claude-opus-5-5 (complex 0.92) via
  classifier`, or `classified standard — kept the session model` when no target was configured.
- **Fixed: the turn-end rule could overflow a narrow terminal.** A long model name (with or without a
  routing chip) produced a line wider than the terminal, which aix's renderer treats as a hard
  contract violation. The label now drops the routing chip first and truncates the model name last,
  always keeping the duration and cost. Found by a test written for the new field; the bug predates
  it.
- `/clear` also resets the prompt-cache baseline, so an emptied conversation no longer reports a
  phantom cache miss on its next turn.

## v2.2.2 — 2026-10-01

- **Classifier routing actually works keyless** — `classifier_for` read `ProviderCfg.api_key`
  directly, so it saw neither env vars, nor the credential store (`aix login`), nor OpenCode Zen's
  public tier. In other words the documented free path returned "no credentials" and routing silently
  never fired. It now resolves credentials through `auth::resolve_auth`, the same path every provider
  uses. Verified end to end against the live endpoint with no key configured anywhere.
- **`/router classifier` adopts the free model when nothing is set** — rather than pointing at the
  docs, it configures `jev-1.13-free` on `opencode` (no API key required; the live endpoint answers
  HTTP 200 with `"cost":"0"`). The paid `jev-1.13` on the same endpoint answers 401 on the public
  tier, so the `-free` suffix is load-bearing.
- **`/router classifier` fails loudly on missing credentials** — it resolves them up front instead of
  accepting the mode and never routing.

## v2.2.1 — 2026-10-01

- **`shell` no longer reports successful commands as failures** — on Windows `powershell -Command`
  exits 1 whenever a native command merely *writes to stderr*, so a succeeding
  `cargo build 2>&1 | Select -Last 1` arrived as exit 1. `shell` flagged that as a tool error, which
  mining real sessions showed made **38% of all `shell` calls look like failures** — successful
  `git commit`s and passing test runs among them. A non-zero exit is now reported as *data* (the
  `[exit code: N]` line the model already sees), matching what `exec_command` has always done;
  `is_error` is reserved for "the tool could not run the command" (timeout, spawn failure). Teaching
  the model to distrust its own successful commands was costing retries.
- **`aix stats --tools` classifies exit codes** — shell failures in historical sessions now group as
  `exit 1`, `exit 101`, … instead of collapsing into `other`.
- **`/cache` and `/router`** — the new settings are reachable without editing JSON. `/cache` shows
  what the session lost to cache misses and takes `warming off|streaming|idle` and `notices on|off`;
  `/router` shows the routing state and takes `off|length|classifier`, refusing a mode that has
  nothing configured to route to.

## v2.2.0 — 2026-10-01

Efficiency and robustness work, most of it ported from ideas in
[earendil-works/pi](https://github.com/earendil-works/pi) (see `dev/PI_GAP_ANALYSIS.md`).

- **Read-only tools run in parallel** — a run of consecutive `read_file` / `read_minified_file` /
  `read_image` / `list_dir` / `glob` / `grep` / `lsp_query` / `tool_search` calls now executes
  concurrently instead of one after another, bounded by `core.max_parallel_tools` (8). Six reads in
  one message cost the slowest read, not the sum. Anything with side effects — edits, writes, shell,
  fetch, computer use, MCP — still runs strictly in order, and results always return in call order.
- **`aix stats --tools`** — mines this project's saved sessions and reports per-tool call counts,
  failure rates, result-token percentiles, failures grouped by kind, read targeting, and **edit
  inflation** (bytes shipped per byte actually changed). No instrumentation: the transcripts are the
  dataset.
- **Multi-edit `edit_file`** — `edits: [{old_string, new_string}]` applies several replacements in
  one call. Every edit matches against the *original* file, so order does not matter and an edit
  cannot cascade into another's text; overlaps are rejected by index, and a single failing edit
  aborts the batch without touching the file. The single `old_string`/`new_string` form still works.
- **Tool arguments are repaired, not rejected** — `file_path` for `path`, pi's `oldText`/`newText`,
  an `edits` array delivered as a JSON string, a lone edit object where an array belongs, `"10"` for
  `10`, `"true"` for `true`. A rejected call costs a full round trip *and* re-bills the conversation
  prefix; these near-misses are unambiguous, so they are now accepted.
- **Cache-miss accounting** — aix tracks when a request re-paid for a prefix it had already cached,
  what it cost, and why (model changed / tool catalog changed / expired while idle / prefix edited).
  Set `core.cache.show_miss_notices` to see it in the transcript.
- **Cache warming** (`core.cache.warming`: `off` | `streaming` | `idle`) — keeps the provider's
  prompt cache alive by replaying the last request with `max_tokens: 1` at 90% of the cache TTL, so
  an idle session does not pay full input price for its whole history on the next turn. Every refresh
  passes an economic gate (`p(continue) × miss_cost − warm_cost ≥ $0.05`), so small sessions never
  warm. Extended-thinking requests are never replayed.
- **Model routing** (`core.router`) — optionally route a session to a cheaper or stronger model from
  a one-question classification of your first message. Supports "System One" classifier models
  (TypeSafe Jev via OpenCode Zen, OpenRouter or TypeSafe — `jev-1.13-free` needs no key), whose
  output tokens are free and input bills ~$0.04/M, so the decision costs ~$0.00001. Routes once per
  session to protect the prompt cache, and any classifier failure leaves the session on its
  configured model. `mode: "length"` routes on prompt size with no extra request.
- **Output caps always leave room** — the configured `max_tokens` is now clamped against the
  remaining context window, so a nearly full session can no longer send a request that asks for more
  output than the window holds.

## v2.1.5 — 2026-10-01

- **`/effort` runs smoothly** — the open picker redraws every animation tick (25 fps) instead of
  about once a second. (The 2.0.1 fix for this never reached the 2.1 line.) A frame of the picker
  costs well under a millisecond and a few hundred bytes of terminal output.
- **The plasma is ultra's alone** — xhigh and max show a clean slider. Landing on ultra blooms the
  field from ultra's tick: a ragged, glowing front spreads over the whole box in about 0.7 s, then
  it churns in rings flowing out from ultra, with sparkles twinkling through it. Words keep a dark
  backing so they stay readable, and leaving ultra dissolves the field within 0.2 s.
- **Ultra is never reported as max** — ultra means xhigh reasoning plus orchestration. The picker
  and `/effort` confirmations now say what is really sent ("sends xhigh to claude-opus-5-5")
  instead of the misleading "caps this — sends max".

## v2.1.4 — 2026-10-01

- **Options in any order** — `--yolo`, `-m`/`--model`, `--provider`, `-p`, `-c`, `-r`, `--json`,
  `--list-sessions` and `--init` now work before or after a subcommand, so `aix resume --last
  --yolo` no longer fails with "unexpected argument". `-m` and the
  `--dangerously-bypass-approvals-and-sandbox` alias now work everywhere, not only with `exec`.
- **`--provider` for credential commands** — `aix login`, `aix logout`, `aix accounts` and
  `aix auth` use it as their provider: `aix logout --provider openai` signs out of OpenAI only.

## v2.1.3 — 2026-09-30

- **Cleaner update output** — Cargo no longer tells you to add aix's temporary build folder to
  `PATH` while an update installs.

## v2.1.2 — 2026-09-30

- **Update checks work again** — the check read a public URL of the private repository (always
  404, silently ignored) and watched `main` rather than the branch aix was built from. It now reads
  the version with your own Git credentials (never prompting), follows the build's branch (the
  default branch once that branch is merged and deleted), and runs in the background at most every
  ten minutes.
- **Update prompt** — when a newer version is known, launching aix asks: *Update now* (builds it
  with Cargo, swaps the binary in place — Windows included — and restarts aix with the same
  arguments), *Skip*, or *Never remind me* (`"check_for_update_on_startup": false`). A version found
  mid-session is announced in the transcript, and `aix update` uses the same safe install.

## v2.1.1 — 2026-09-30

- **Login selects the startup provider** — successful sign-in now saves the provider and a
  compatible model as user defaults. Fresh installs offer a provider picker rather than forcing
  Anthropic authentication. Existing OpenAI logins are recovered automatically when no explicit
  provider/model choice exists; project settings, flags, and resumed sessions remain authoritative.

## v2.1.0 — 2026-09-30

- **Long answers no longer stop the chat** — a response that hits `max_tokens` (easy with
  always-on thinking at high effort) used to end the turn with "response hit max_tokens". Now aix
  retries it at the model's own output ceiling (128K on current Claude models; read from the
  models API, with documented fallbacks), keeps that limit for the session, and clamps it to the
  context window. At the ceiling it keeps the partial answer and lets the model resume — up to 3
  times in a row. A tool call cut off mid-arguments is never executed: the model gets an error
  and redoes it in smaller pieces. A provider that refuses a raised cap is retried with the limit
  its error names. OpenAI-compatible `length` stops with tool calls take the same path.
  Subagents, goals, workflows and peers benefit too.
- **Computer use, redesigned** — the desktop overlay is rebuilt on per-pixel-alpha layered
  windows with an anti-aliased software renderer in the aix palette:
  - a soft glow along every monitor's edges (or the approved window) with a drifting gradient and
    a light comet;
  - a status pill with the current action, a thinking spinner, an animated border and
    Ctrl+Alt+F12 keycaps — it fades when the pointer works beneath it;
  - an AI cursor ring with an "AIX · clicking" tag and click ripples.

  Everything fades in before control starts and fades out after. Overlays are excluded from
  screen capture, so the model's screenshots show the real desktop. Stopping returns in
  milliseconds instead of waiting on the overlay. It costs about 4 % of one core on two 1440p
  monitors.
- **Readable computer-use transcript** — calls show as "◎ Double-clicked 412, 380",
  "Typed “hello”", "Pressed Ctrl+S" or "Took control of the desktop · <task>", and failures
  show their reason.

## v2.0.1 — 2026-09-30

- **Release film** — `video/` renders the aix v2 launch video (1080p60, synthesised soundtrack):
  every v2 feature as a chapter, plus size and startup measured against Claude Code, Codex CLI and
  OpenCode (`video/bench/bench.py`). `python video/render.py` builds it; see the script's header.
- **Light on the machine** — the renderer runs its whole process tree (Chrome's GPU and renderer
  processes included) at below-normal priority with at most 4 browsers, and works around a CPython
  3.14 `asyncio.wait()` leak that kept every captured frame (3.7 MB) in memory: a render now
  stays around 1 GB per worker instead of piling up ~25 GB over the film.

## v2.0.0 — 2026-09-30

aix v2 is a ground-up rebuild of the agent core and the terminal UI.

### Highlights

- **New look** — the axolotl theme with **Axo** in the header, a flowing composer, keycap
  footer, tool cells with icons, a dock with the plan and live agents, light-terminal support.
- **Helpers with personality** — every subagent gets a one-of-a-kind, randomly drawn animated
  mascot with a wardrobe: top hat, crown, beanie, cowboy/wizard hat, cap, chef's hat, halo,
  antenna, bear/bunny ears, horns, flower, bow, headphones, sprout, propeller cap; monocle,
  glasses, moustache, blush, eye patch; bow tie, scarf, beard, tummy patch. No two alike.
- **`/effort` slider** — *Faster ↔ Smarter* with a gliding marker, a charging track and an
  animated plasma field that heats up at xhigh, max and ultra.
- **Automatic reconnects** — a dropped or reset connection (e.g. `os error 10054`) no longer
  fails the chat: aix waits and resends (1 s → 30 s, up to 12 attempts) with a single,
  self-updating "reconnecting in …" notice; `Esc` stops waiting.
- **Codex-grade tools** — `apply_patch`, long-running `exec_command` sessions, `update_plan`,
  command safety rules, `aix exec --json`.
- **Ultra mode** — phased plans, parallel subagents and verification, shown live in the dock.
- **Durable sessions** — SQLite/WAL storage, crash-safe saves, crash reports, recoverable
  subagents, rate-limit pauses that resume on their own, Codex and Claude Code session import.
- **Plugins & MCP** — Claude Code and Codex marketplaces, hot-reloaded MCP servers, skills.
- **Computer use** on Windows, with visible indicators and a global stop key.
- **More models & accounts** — Claude 5 family and Sonnet 5.5, GPT-6 / GPT-5.6 with ChatGPT
  sign-in, Grok, GLM, OrcaRouter, free tiers, and several accounts per provider.

### Docs

- A shorter, friendlier README with an animated banner (`dev/banner.py` regenerates it); the
  reference material moved to [`docs/`](docs/).
