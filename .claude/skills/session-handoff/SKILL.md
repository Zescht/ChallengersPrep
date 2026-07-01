---
name: session-handoff
description: Use when ending a work session, wrapping up, or when the user says "handoff", "wrap up", "end session", or "create handoff". Creates a timestamped handoff file summarizing the session and evaluates whether the project CLAUDE.md needs updating with durable knowledge.
---

# Session Handoff

## Overview

At session end, write two things: a timestamped handoff file capturing ephemeral session state, and optionally update the project CLAUDE.md with any permanent knowledge that emerged this session.

**handoff file** = what happened today, what's next, what's fragile right now  
**CLAUDE.md** = permanent project rules and architecture that survive across all sessions

## Step 1 — Write the Handoff File

### File naming

Format: `handoff_DD_MM_YY_HHhMMm`  
Example: `handoff_07_06_26_14h39m`

Get the current date and time before writing. Place the file in a `handoffs/` folder at the project root. Create the folder if it doesn't exist.

### File structure

```markdown
# Handoff — DD/MM/YY HH:MMh

## Project Context
One or two sentences: what is this project and what is it for.

## Session Summary
What this session was about in 2–3 sentences.

## Completed This Session
- [feature / fix / change] — brief description of what was done

## Files Changed
- `path/to/file.ext` — what changed and why

## New Features / Workflows Added
- **[Feature name]**: what it does, which files are involved, any new dependencies or side effects

## Decisions Made
- **[Decision]**: why this was chosen over the alternative. What it affects going forward.

## Next Up
The single most important next task. Specific enough that a cold session can act on it immediately without re-reading the whole codebase.

## Starting Point
Exact instruction to give Claude at the start of the next session:
> "Read handoffs/handoff_DD_MM_YY_HHhMMm.md, then [specific first action]"

## Gotchas
- Anything half-finished, broken, or intentionally left in a non-standard state
- Known side effects of changes made this session
- Files or workflows that are now load-bearing but may not look like it
```

### Quality bar for each section

**Files Changed** — include path and reason, not just the filename. "Changed X" is useless. "Changed X to fix the Y edge case" is useful.

**Decisions Made** — the WHY is what matters. Git already records what changed. This section records why you didn't do it differently.

**Next Up** — one task only. If there are multiple, pick the one that unblocks everything else. List others in Gotchas.

**Starting Point** — must be copy-pasteable. A future session should be able to paste this as the first message and resume immediately.

**Gotchas** — default to over-including. Anything you thought about during the session but didn't finish belongs here.

---

## Step 2 — Evaluate CLAUDE.md

After writing the handoff file, check whether anything from this session is **permanent** project knowledge.

Ask: *"Would a future session make a wrong decision or be confused without knowing this?"*

**Update CLAUDE.md if:**
- New conventions introduced (naming patterns, file structure, code style)
- New load-bearing files or folders created that aren't obvious
- Architectural decisions made that constrain future work
- A workflow changed in a way that is now the standard approach

**Do NOT update CLAUDE.md for:**
- Task-specific details that belong only in the handoff
- Bugs fixed (history, not a rule)
- Anything that was a one-off and won't repeat

**How to update:** Add to the relevant existing section rather than appending a new block each time. Keep CLAUDE.md clean and scannable — it should describe the project as it is now, not log what changed over time.

---

## Checklist

- [ ] `handoffs/` folder exists at project root
- [ ] Filename uses correct format: `handoff_DD_MM_YY_HHhMMm`
- [ ] "Files Changed" includes path + reason for each file
- [ ] "Next Up" is specific enough to act on cold
- [ ] "Starting Point" is a copy-pasteable instruction
- [ ] "Gotchas" covers anything unresolved or fragile
- [ ] CLAUDE.md evaluated — updated if session produced durable knowledge
