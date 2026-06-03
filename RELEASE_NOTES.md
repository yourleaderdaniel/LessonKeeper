First public release of **LessonKeeper** — a desktop app for teachers and private tutors to keep track of paid individual lessons.

## Features

- Students with default-or-custom lesson prices and prepaid balances (negative = debt).
- Weekly recurring calendar of lessons by weekday + time.
- Automatic balance deduction when a lesson's time passes (in real time while the app is open, and catch-up after restart).
- Cancel and refund per specific occurrence via the lesson history dialog.
- Interface in **Russian**, **Ukrainian**, **English** — switch live.
- Currencies: **UAH**, **RUB**, **USD**, **EUR**.
- **24-hour** and **12-hour** time formats.
- Home screen as table or cards (your choice).
- Data stored locally in JSON. Built-in **export/import** to a single backup file.
- Modern dark UI, no servers, no accounts.

## Install

Pick one and run it:

- **`LessonKeeper_0.1.0_x64-setup.exe`** — NSIS installer (smallest, recommended for most users).
- **`LessonKeeper_0.1.0_x64_en-US.msi`** — MSI installer (for managed installs).

Both add LessonKeeper to your Start Menu and "Add or Remove Programs". No external dependencies on Windows 10/11.

## Where your data lives

```
C:\Users\<you>\AppData\Roaming\com.lessonkeeper.app\lessonkeeper.json
```

You can back it up manually anytime, or use Settings → "Export data" to save it wherever you want.
