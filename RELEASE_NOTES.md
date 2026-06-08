## v0.2.0 — Profit screen, post-paid students, dialog fixes

### New

- **Profit screen**: a new sidebar tab showing how much you've earned. Three big numbers (this month, last 30 days, all time) plus a month-by-month breakdown and the last 25 completed lessons with student names and amounts.
- **Post-paid students**: when adding/editing a student you can now pick **Pays after lesson** instead of Prepaid. For those students no prepaid balance is tracked — each completed lesson simply counts toward Profit, and a cancelled lesson cancels cleanly (nothing is added or refunded).

### Fixes

- **Add/Edit dialog no longer closes when you select text and drag the mouse outside the field.** The backdrop click now requires both the press AND the release to happen on the backdrop.
- **Input length limits** on the student form: name up to 60 chars, phone up to 24 chars, prices up to 7 digits, balance up to 9 digits. No more 50-digit phone numbers or prepaid balances of a billion zeros.

### Notes

- Existing data is fully compatible — students saved before this version are treated as Prepaid automatically.
- The version number in the sidebar updates to `v0.2.0`.

## Installers

- **`LessonKeeper_0.2.0_x64-setup.exe`** — NSIS installer (recommended).
- **`LessonKeeper_0.2.0_x64_en-US.msi`** — MSI installer.

If you already had v0.1.0 installed, running the new installer upgrades in place — your data in `%APPDATA%\com.lessonkeeper.app\lessonkeeper.json` is preserved.
