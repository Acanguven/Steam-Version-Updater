# Steam Game Search CLI

A command-line application for searching Steam games and applications, built with Node.js.

## Features

- Anonymous login to Steam using the official Steam client protocol
- Search for games and applications in the Steam store
- Interactive selection of search results
- Display detailed information about selected applications
- Clean and colorful command-line interface

## Installation

### Prerequisites

- Node.js 14.0.0 or later
- npm

### Setup

1. Clone the repository or download the source code
2. Install dependencies:

```bash
npm install
```

## Usage

Run the application:

```bash
node steam-search.js
```

### How It Works

1. The application logs into Steam anonymously
2. You'll be prompted to enter a search term for games/applications
3. The application searches the Steam Store API for matching games
4. A list of matching applications is displayed with pricing information
5. Select an application to view detailed information
6. The application logs out of Steam and exits

## Dependencies

- [steam-user](https://github.com/DoctorMcKay/node-steam-user) - For interacting with Steam
- [axios](https://github.com/axios/axios) - For making HTTP requests to the Steam Store API
- [inquirer](https://github.com/SBoudrias/Inquirer.js) - For interactive command-line prompts
- [chalk](https://github.com/chalk/chalk) - For colorful terminal output
- [commander](https://github.com/tj/commander.js) - For command-line interface structure

## Future Enhancements

- Add ability to view more detailed game information
- Implement sorting and filtering of search results
- Save search history
- Display game reviews and ratings

## License

MIT
