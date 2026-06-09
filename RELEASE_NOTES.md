## v0.3.0 — Vacations and Notes

### New features

- **Pause a student on vacation.** A new ⏸ button next to Edit/Delete on each student row. While paused, no balance is deducted, the lesson doesn't count toward Profit, and the student's calendar entries are dimmed. Click ▶ to bring them back — processing resumes from that moment forward (the break period is never retroactively charged).
- **Notes screen.** A new sidebar tab (📝) that's a personal scratchpad for any thoughts: per-student notes, lesson ideas, reminders, anything. Two-pane layout with a notes list on the left and an editor on the right. Create as many as you want; each is auto-saved to your local data file.

### How vacations work

- Paused students are marked with a yellow «На каникулах» / «On break» tag on Home and Calendar.
- Auto-deduction silently skips their lessons during the break.
- The internal "last processed at" watermark still advances during the break — so when you un-pause, nothing is retroactively charged.
- If you want to count an individual lesson during a break (e.g. they came once), open the Calendar history dialog for that lesson and toggle that date from "Not processed yet" to "Completed".

## Installers

- **`LessonKeeper_0.3.0_x64-setup.exe`** — NSIS installer (recommended).
- **`LessonKeeper_0.3.0_x64_en-US.msi`** — MSI installer.

Upgrading from v0.2.0 or earlier preserves all your existing data — students, lessons, history, and settings carry over automatically.
