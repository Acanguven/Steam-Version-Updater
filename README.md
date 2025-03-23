# Steam Version Updater

A command-line tool for finding and downloading specific versions of Steam games.

## Features

- Search for games and applications in the Steam store
- Browse and select game depots (content packages)
- Find different versions (manifests) of game content
- Generate commands for the Steam console to download specific game versions
- Interactive and colorful command-line interface

## Usage

### Quick Usage with npx (Recommended)

Run directly without installing:

```bash
npx steam-version-updater
```

This runs the latest version without requiring any installation.

### Installation Options

If you prefer to install:

```bash
# Install locally in a project
npm install steam-version-updater

# Or install globally
npm install -g steam-version-updater
```

Then run with:

```bash
# If installed locally
npx steam-version-updater

# If installed globally
steam-version-updater
```

## Demo

Here's an example of what to expect when using the tool:

```
$ npx steam-version-updater

Enter game name to search: Stardew Valley

Found 15 matching applications:

? Select an application: (Use arrow keys)
❯ Stardew Valley (413150)
  Stardew Valley OST (440820)
  Stardew Valley - Soundtrack (440820)
  Stardew Valley Collector's Edition Soundtrack (573760)
  Stardew Valley: Expanded Pack (1192778)
  // more options...

Selected Application Details:
Name: Stardew Valley
AppID: 413150
Type: Game

Found 4 depots for this application:

? Select a depot: (Use arrow keys)
❯ Windows content (ID: 413153) - Windows
  Mac content (ID: 413154) - macOS
  Linux content (ID: 413155) - Linux
  Soundtrack (ID: 413156) - All Platforms [Optional]

Selected Depot Details:
Name: Windows content
ID: 413153
OS Type: Windows

Found 8 manifests for this depot:

? Select a manifest: (Use arrow keys)
---- Current Branch Manifests ----
❯ public (Build ID: 8071262) - Updated: 3/19/2022, 10:05:32 AM [Public]
  beta (Build ID: 8071262) - Updated: 3/19/2022, 10:05:32 AM [Private]
  // more branches...

---- Previously Seen Manifests ----
  Manifest: 2683855289566189597 - Seen: 1/21/2022, 3:24:10 PM (2 months ago)
  Manifest: 2594818391333682586 - Seen: 11/2/2021, 8:42:11 AM (4 months ago)
  // more manifests...

Selected Manifest Details:
Branch: public
Build ID: 8071262
Manifest ID: 8881193748180768755
Public: Yes
Last Updated: 3/19/2022, 10:05:32 AM

Steam Console Command:
download_depot 413150 413153 8881193748180768755

Command with instructions (you can copy this whole block):
download_depot 413150 413153 8881193748180768755

// IMPORTANT: Wait for download to complete (no progress indicator). After completion, copy files from Steam\steamapps\content\app_413150\depot_413153 to your game folder.

✓ Steam console activated with command!
✓ Command copied to clipboard
The download command should automatically appear in the Steam console.

IMPORTANT POST-DOWNLOAD INSTRUCTIONS:
1. After running the command, wait for the download to complete (there is no progress indicator)
2. When complete, you'll see a message like: "Depot download complete : [path] ([files], manifest [id])"
3. Go to the download location shown in the message (usually in Steam\steamapps\content\app_413150\depot_413153)
4. Copy all files from this folder to your game installation directory to complete the update

Tip: You can open the download location directly by entering this in File Explorer address bar:
 %PROGRAMFILES(X86)%\Steam\steamapps\content\app_413150\depot_413153
```

## Requirements

- Node.js 14.0.0 or later
- A working Steam installation
- Steam must be running when using this tool

## How It Works

1. The tool connects to Steam anonymously
2. You search for a game by name
3. Select the game from search results
4. Browse available content depots for the game
5. Select a specific manifest (version) of the content
6. The tool generates a Steam console command and opens the console
7. The command is automatically copied to your clipboard
8. Paste the command into the Steam console to download the specific game version

## Dependencies

- [steam-user](https://github.com/DoctorMcKay/node-steam-user) - For interacting with Steam
- [axios](https://github.com/axios/axios) - For making HTTP requests
- [inquirer](https://github.com/SBoudrias/Inquirer.js) - For interactive command-line prompts
- [chalk](https://github.com/chalk/chalk) - For colorful terminal output
- [commander](https://github.com/tj/commander.js) - For command-line interface structure

## License

MIT
