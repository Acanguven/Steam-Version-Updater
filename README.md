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
