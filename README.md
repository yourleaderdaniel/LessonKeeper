# LessonKeeper

A desktop app for teachers and private tutors to keep track of paid individual lessons — students, weekly schedules, prepaid balances, and automatic deductions when a lesson's time passes.

Built with [Tauri 2](https://tauri.app) + [React](https://react.dev) + TypeScript. Runs natively on Windows 10/11. Data is stored locally in JSON under your user's `AppData` folder — no servers, no accounts, no cloud.

## Features

- **Students**: name, default-or-custom lesson price, prepaid balance (can go negative = debt), optional phone column.
- **Calendar**: weekly recurring lessons by weekday + time.
- **Automatic balance deduction**: when a scheduled lesson's time passes, the price is automatically deducted from the student's prepaid balance. Works in real time while the app is open and catches up after restart.
- **Cancel / refund**: cancel a specific occurrence (past or future) from the lesson history dialog. Past completed lessons refund money back to the balance.
- **Languages**: Russian, Ukrainian, English (switch live, full UI translation).
- **Currencies**: UAH, RUB, USD, EUR.
- **Time formats**: 24-hour or 12-hour (with AM/PM).
- **Two list views** on the home screen: table or cards.
- **Backup**: export/import all data to a single JSON file (any location you choose).
- **Modern dark UI** built for desktop use, with sidebar navigation and keyboard support.

## Install

Grab the latest installer from the [Releases](../../releases) page:

- **`LessonKeeper_x.y.z_x64-setup.exe`** — NSIS installer (recommended for most users).
- **`LessonKeeper_x.y.z_x64_en-US.msi`** — MSI installer (for managed/group installs).

Both create Start Menu and Desktop shortcuts, register the app under "Add or Remove Programs", and require no extra dependencies on Windows 10/11.

Where your data lives:
```
C:\Users\<you>\AppData\Roaming\com.lessonkeeper.app\lessonkeeper.json
```

## Build from source

Prerequisites:
- [Node.js LTS](https://nodejs.org/) (v20+)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-studio-build-tools/) with the "Desktop development with C++" workload

```bash
git clone https://github.com/<your-username>/LessonKeeper.git
cd LessonKeeper
npm install

# Development with hot-reload:
npm run tauri dev

# Standalone .exe (no installer):
npm run tauri build -- --no-bundle

# Full installer (.msi + .exe setup):
npm run tauri build
```

Build outputs land in `src-tauri/target/release/` (binary) and `src-tauri/target/release/bundle/` (installers).

## Project layout

```
src/
  App.tsx              — root + screen routing
  components/          — Modal, TimeInput, dialogs
  screens/             — Home, Calendar, Settings
  data/                — types, persistent store, app state
  i18n/                — translation dictionaries + useT hook
  util/                — money/time formatting, balance logic, dates
src-tauri/
  src/lib.rs           — Tauri commands and plugin setup
  tauri.conf.json      — app metadata and bundle config
```

## License

[MIT](LICENSE)
