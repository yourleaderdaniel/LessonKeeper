## v0.3.1 — Custom icon and configurable installer

### What's new

- **Custom app icon.** LessonKeeper now ships with its own brand icon everywhere: the executable in Explorer, the title-bar and taskbar icon, the Start Menu shortcut, the favicon, and the sidebar brand mark inside the app.
- **Choose where to install.** The Windows NSIS installer now opens a small wizard that lets you:
  - Pick **Install for me only** (default — installs to `%LOCALAPPDATA%\Programs\LessonKeeper`, no admin needed) or **Install for everyone** (default — installs to `C:\Program Files\LessonKeeper`, asks for admin).
  - Pick **any drive and folder** for the install location via the **Browse…** button on the destination page. The default stays on your main drive (C:), but you can point it at D:, E:, an SSD, an external drive, anywhere.
- Smaller installer size thanks to LZMA compression (the strongest NSIS supports).

### Notes

- Your data file location (`%APPDATA%\com.lessonkeeper.app\lessonkeeper.json`) is **not** affected by where the program is installed — it always lives under your user profile, no matter which drive the .exe ended up on.
- Upgrading from v0.3.0 or earlier preserves all your students, lessons, history, notes, and settings.

## Installers

- **`LessonKeeper_0.3.1_x64-setup.exe`** — NSIS installer (recommended, with the new directory wizard).
- **`LessonKeeper_0.3.1_x64_en-US.msi`** — MSI installer (Windows Installer; also lets you change the install dir).
