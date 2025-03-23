#!/usr/bin/env node
const { SteamClient, SteamSearch, CLI } = require("./lib");

/**
 * Main application class
 */
class SteamSearchApp {
  /**
   * Create a new Steam search application
   */
  constructor() {
    this.steamClient = new SteamClient();
    this.steamSearch = new SteamSearch();
    this.cli = new CLI();
  }

  /**
   * Run the application
   */
  async run() {
    try {
      // Initialize the CLI
      this.cli.parseArguments(this.start.bind(this));
    } catch (error) {
      console.error("Error running the application:", error.message);
      process.exit(1);
    }
  }

  /**
   * Start the application flow
   */
  async start() {
    try {
      // Login to Steam anonymously
      await this.steamClient.login();

      // Get search term from user
      const searchTerm = await this.cli.getSearchTerm();

      // Search for games
      const games = await this.steamSearch.searchGames(searchTerm);

      // If no games found, exit
      if (games.length === 0) {
        this.steamClient.logout();
        process.exit(0);
      }

      // Let user select a game
      const selectedGame = await this.cli.selectGame(games);

      // Display details of the selected game
      this.cli.displayGameDetails(selectedGame);

      // Fetch depot information for the selected game
      const depots = await this.steamClient.getGameDepots(selectedGame.appid);

      // Let user select a depot
      const selectedDepot = await this.cli.selectDepot(depots);

      // Display details of the selected depot
      if (selectedDepot) {
        this.cli.displayDepotDetails(selectedDepot);

        // Fetch manifest information for the selected depot
        const manifests = await this.steamClient.getDepotManifests(
          selectedGame.appid,
          selectedDepot.id
        );

        // Let user select a manifest
        const selectedManifest = await this.cli.selectManifest(manifests);

        // Display details of the selected manifest and generate Steam command
        if (selectedManifest) {
          this.cli.displayManifestDetails(
            selectedManifest,
            selectedGame.appid,
            selectedDepot.id
          );
        }
      }

      // Logout and display completion message
      this.steamClient.logout();
      this.cli.displayCompletion();
    } catch (error) {
      console.error("Error:", error.message);
      if (this.steamClient) {
        this.steamClient.logout();
      }
      process.exit(1);
    }
  }
}

// Create and run the application
const app = new SteamSearchApp();
app.run();
