const inquirer = require("inquirer");
const chalk = require("chalk");
const { Command } = require("commander");
const { exec } = require("child_process");

/**
 * Class for handling CLI interactions and user interface
 */
class CLI {
  /**
   * Create a new CLI handler
   */
  constructor() {
    this.program = new Command();
    this.currentAppId = null;
    this.currentDepotId = null;
    this.currentManifestId = null;

    this.program
      .name("steam-search")
      .description("Search for Steam games and applications")
      .version("1.0.0");
  }

  /**
   * Check if Steam is running
   * @returns {Promise<boolean>} True if Steam is running
   */
  checkSteamRunning() {
    return new Promise((resolve) => {
      exec('tasklist /FI "IMAGENAME eq steam.exe" /NH', (error, stdout) => {
        if (error) {
          console.log(
            chalk.red("\nError checking if Steam is running:", error.message)
          );
          resolve(false);
          return;
        }

        // If steam.exe is found in the tasklist output
        const isSteamRunning = stdout.toLowerCase().includes("steam.exe");

        if (!isSteamRunning) {
          console.log(
            chalk.red(
              "\nSteam is not running! Please start Steam before using this tool."
            )
          );
        }

        resolve(isSteamRunning);
      });
    });
  }

  /**
   * Get search term from user
   * @returns {Promise<string>} The search term
   */
  async getSearchTerm() {
    // First verify Steam is running
    const isSteamRunning = await this.checkSteamRunning();
    if (!isSteamRunning) {
      throw new Error("Steam must be running to use this tool.");
    }

    const { searchTerm } = await inquirer.prompt([
      {
        type: "input",
        name: "searchTerm",
        message: "Enter game name to search:",
        validate: (input) => {
          if (!input.trim()) {
            return "Please enter a game name to search";
          }
          return true;
        },
      },
    ]);

    return searchTerm;
  }

  /**
   * Display the list of found games and let user select one
   * @param {Array} appList - List of apps to display
   * @returns {Promise<Object>} The selected app
   */
  async selectGame(appList) {
    console.log(
      chalk.green(`\nFound ${appList.length} matching applications:\n`)
    );

    const choices = appList.map((app) => ({
      name: `${app.name} (${app.appid})`,
      value: app,
    }));

    const { selectedApp } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedApp",
        message: "Select an application:",
        choices: choices,
        pageSize: 15,
      },
    ]);

    return selectedApp;
  }

  /**
   * Display the list of depots and let user select one
   * @param {Array} depotList - List of depots to display
   * @returns {Promise<Object>} The selected depot
   */
  async selectDepot(depotList) {
    if (depotList.length === 0) {
      console.log(chalk.yellow("\nNo depots found for this application."));
      return null;
    }

    console.log(
      chalk.green(`\nFound ${depotList.length} depots for this application:\n`)
    );

    const choices = depotList.map((depot) => ({
      name: `${depot.name} (ID: ${depot.id}) - ${depot.osType || "Unknown OS"}${
        depot.optional ? " [Optional]" : ""
      }${depot.language ? ` [${depot.language}]` : ""}`,
      value: depot,
    }));

    const { selectedDepot } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedDepot",
        message: "Select a depot:",
        choices: choices,
        pageSize: 15,
      },
    ]);

    return selectedDepot;
  }

  /**
   * Display details about the selected game
   * @param {Object} app - The selected app
   */
  displayGameDetails(app) {
    console.log(chalk.green("\nSelected Application Details:"));
    console.log(chalk.white(`Name: ${app.name}`));
    console.log(chalk.white(`AppID: ${app.appid}`));
    console.log(chalk.white(`Type: ${app.type}`));
  }

  /**
   * Display details about the selected depot
   * @param {Object} depot - The selected depot
   */
  displayDepotDetails(depot) {
    if (!depot) return;

    console.log(chalk.green("\nSelected Depot Details:"));
    console.log(chalk.white(`Name: ${depot.name}`));
    console.log(chalk.white(`ID: ${depot.id}`));
    console.log(chalk.white(`OS Type: ${depot.osType || "Unknown"}`));

    // Display size information if available
    if (depot.maxSize) {
      console.log(chalk.white(`Max Size: ${this.formatSize(depot.maxSize)}`));
    }
    if (depot.encryptedSize) {
      console.log(
        chalk.white(`Encrypted Size: ${this.formatSize(depot.encryptedSize)}`)
      );
    }

    // Display additional useful flags
    if (depot.language) {
      console.log(chalk.white(`Language: ${depot.language}`));
    }
    if (depot.dlcAppId) {
      console.log(chalk.white(`DLC App ID: ${depot.dlcAppId}`));
    }

    // Display property flags
    const flags = [];
    if (depot.optional) flags.push("Optional");
    if (depot.systemDefined) flags.push("System Defined");
    if (depot.sharedInstall) flags.push("Shared Install");

    if (flags.length > 0) {
      console.log(chalk.white(`Flags: ${flags.join(", ")}`));
    }
  }

  /**
   * Format file size in human readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Display completion message
   */
  displayCompletion() {
    if (this.currentAppId && this.currentDepotId && this.currentManifestId) {
      console.log(chalk.blue("\nProcess completed successfully."));

      // Display the command one more time at the end for clarity
      const steamCommand = `download_depot ${this.currentAppId} ${this.currentDepotId} ${this.currentManifestId}`;
      console.log(chalk.bgGreen.black("\nCOMMAND TO USE IN STEAM CONSOLE:"));
      console.log(chalk.bgWhite.black(` ${steamCommand} `));
      console.log(
        chalk.white(
          "\nWhen the Steam console opens, paste the command to start the download."
        )
      );
    } else {
      console.log(chalk.blue("\nSearch completed."));
    }
  }

  /**
   * Parse command line arguments
   * @param {Function} callback - The function to call with parsed args
   */
  parseArguments(callback) {
    this.program.action(callback);
    this.program.parse(process.argv);
  }

  /**
   * Display the list of manifests and let user select one
   * @param {Array} manifestList - List of manifests to display
   * @returns {Promise<Object>} The selected manifest
   */
  async selectManifest(manifestList) {
    if (manifestList.length === 0) {
      console.log(chalk.yellow("\nNo manifests found for this depot."));
      return null;
    }

    // Group manifests by type (current branches vs historical)
    const currentManifests = manifestList.filter((m) => !m.isHistorical);
    const historicalManifests = manifestList.filter((m) => m.isHistorical);

    console.log(
      chalk.green(`\nFound ${manifestList.length} manifests for this depot:\n`)
    );

    // Create choices with sections
    const choices = [];

    // Add branch manifests first
    if (currentManifests.length > 0) {
      choices.push(
        new inquirer.Separator(
          chalk.yellow("---- Current Branch Manifests ----")
        )
      );

      currentManifests.forEach((manifest) => {
        let label = `${manifest.branch} (Build ID: ${manifest.buildId})`;

        // Add time information if available
        if (manifest.timeupdated) {
          const date = new Date(manifest.timeupdated * 1000);
          label += ` - Updated: ${date.toLocaleString()}`;
        }

        // Add public/private indicator
        label += manifest.isPublic ? " [Public]" : " [Private]";

        // Add description if available
        if (manifest.description) {
          label += ` - ${manifest.description}`;
        }

        choices.push({
          name: label,
          value: manifest,
        });
      });
    }

    // Add historical manifests
    if (historicalManifests.length > 0) {
      choices.push(
        new inquirer.Separator(
          chalk.yellow("\n---- Previously Seen Manifests ----")
        )
      );

      historicalManifests.forEach((manifest) => {
        let label = `Manifest: ${manifest.manifestId}`;

        // Add time information if available
        if (manifest.timeupdated) {
          const date = new Date(manifest.timeupdated * 1000);
          const relativeTime = this.getRelativeTimeString(manifest.timeupdated);
          label += ` - Seen: ${date.toLocaleString()} (${relativeTime})`;
        }

        choices.push({
          name: label,
          value: manifest,
        });
      });
    }

    const { selectedManifest } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedManifest",
        message: "Select a manifest:",
        choices: choices,
        pageSize: 15,
      },
    ]);

    return selectedManifest;
  }

  /**
   * Display details about the selected manifest
   * @param {Object} manifest - The selected manifest
   * @param {number} appId - The app ID
   * @param {number} depotId - The depot ID
   */
  displayManifestDetails(manifest, appId, depotId) {
    if (!manifest) return;

    // Store current IDs for generating the command
    this.currentAppId = appId;
    this.currentDepotId = depotId;
    this.currentManifestId = manifest.manifestId;

    console.log(chalk.green("\nSelected Manifest Details:"));

    if (manifest.isHistorical) {
      console.log(chalk.white(`Manifest ID: ${manifest.manifestId}`));

      if (manifest.timeupdated) {
        const date = new Date(manifest.timeupdated * 1000);
        console.log(chalk.white(`First Seen: ${date.toLocaleString()}`));
      }

      console.log(chalk.white(`Type: Previously seen manifest`));
    } else {
      console.log(chalk.white(`Branch: ${manifest.branch}`));
      console.log(chalk.white(`Build ID: ${manifest.buildId}`));
      console.log(chalk.white(`Manifest ID: ${manifest.manifestId}`));

      if (manifest.description) {
        console.log(chalk.white(`Description: ${manifest.description}`));
      }

      console.log(chalk.white(`Public: ${manifest.isPublic ? "Yes" : "No"}`));

      if (manifest.timeupdated) {
        const date = new Date(manifest.timeupdated * 1000);
        console.log(chalk.white(`Last Updated: ${date.toLocaleString()}`));
      }
    }

    // Generate and display the Steam command
    this.generateSteamCommand();
  }

  /**
   * Generate the Steam command for downloading a depot with the selected manifest
   */
  generateSteamCommand() {
    if (!this.currentAppId || !this.currentDepotId || !this.currentManifestId) {
      console.log(
        chalk.red("\nMissing required information to generate Steam command.")
      );
      return;
    }

    const steamCommand = `download_depot ${this.currentAppId} ${this.currentDepotId} ${this.currentManifestId}`;

    // Create a command with instructions
    const commandWithNotes = `${steamCommand}\n\n// IMPORTANT: Wait for download to complete (no progress indicator). After completion, copy files from Steam\\steamapps\\content\\app_${this.currentAppId}\\depot_${this.currentDepotId} to your game folder.`;

    // Initial display of the command
    console.log(chalk.green("\nSteam Console Command:"));
    console.log(chalk.cyan(steamCommand));

    console.log(
      chalk.green(
        "\nCommand with instructions (you can copy this whole block):"
      )
    );
    console.log(chalk.cyan(commandWithNotes));

    // First try to copy to clipboard using powershell on Windows
    exec(
      `powershell -command "Set-Clipboard -Value '${commandWithNotes}'"`,
      (error, stdout, stderr) => {
        // After clipboard operation, open Steam console
        this.openSteamConsole(steamCommand, !error);
      }
    );
  }

  /**
   * Open the Steam console automatically
   * @param {string} steamCommand - The Steam command to use
   * @param {boolean} clipboardSuccess - Whether clipboard copy was successful
   */
  openSteamConsole(steamCommand, clipboardSuccess) {
    // Create command with notes for display if needed
    const note = `IMPORTANT: Wait for download to complete (no progress indicator). After completion, copy files from Steam\\steamapps\\content\\app_${this.currentAppId}\\depot_${this.currentDepotId} to your game folder.`;
    const commandWithNotes = `${steamCommand}\n\n${note}`;

    // Open URL using the default browser on Windows with command as argument
    exec(`start steam://open/console`, (error) => {
      if (error) {
        console.log(
          chalk.yellow("\nCould not open Steam console:", error.message)
        );
        console.log(
          chalk.white(
            "Please open Steam console manually and paste the command."
          )
        );

        // Show clipboard status after console status
        if (clipboardSuccess) {
          console.log(chalk.green("\n✓ Command copied to clipboard"));
        } else {
          console.log(chalk.yellow("\nCould not copy command to clipboard."));
          console.log(chalk.bgRed.white("\nUSE THIS COMMAND:"));
          console.log(chalk.bgCyan.black(` ${commandWithNotes} `));
        }
      } else {
        console.log(chalk.green("\n✓ Steam console activated with command!"));

        // Show clipboard status after console status
        if (clipboardSuccess) {
          console.log(chalk.green("✓ Command copied to clipboard"));
          console.log(
            chalk.white(
              "The download command should automatically appear in the Steam console."
            )
          );

          // Add post-download instructions
          this.displayPostDownloadInstructions();
        } else {
          console.log(chalk.yellow("Could not copy command to clipboard."));
          console.log(
            chalk.white("Verify that the command is in the Steam console:")
          );
          console.log(chalk.bgCyan.black(` ${steamCommand} `));

          // Add post-download instructions
          this.displayPostDownloadInstructions();
        }
      }
    });
  }

  /**
   * Display instructions for what to do after depot download completes
   */
  displayPostDownloadInstructions() {
    console.log(
      chalk.bgYellow.black("\nIMPORTANT POST-DOWNLOAD INSTRUCTIONS:")
    );
    console.log(
      chalk.white(
        "1. After running the command, wait for the download to complete (there is no progress indicator)"
      )
    );
    console.log(
      chalk.white(
        '2. When complete, you\'ll see a message like: "Depot download complete : [path] ([files], manifest [id])"'
      )
    );
    console.log(
      chalk.white(
        `3. Go to the download location shown in the message (usually in Steam\\steamapps\\content\\app_${this.currentAppId}\\depot_${this.currentDepotId})`
      )
    );
    console.log(
      chalk.white(
        "4. Copy all files from this folder to your game installation directory to complete the update"
      )
    );

    // Add option to open the download directory
    console.log(
      chalk.cyan(
        "\nTip: You can open the download location directly by entering this in File Explorer address bar:"
      )
    );
    console.log(
      chalk.bgWhite.black(
        ` %PROGRAMFILES(X86)%\\Steam\\steamapps\\content\\app_${this.currentAppId}\\depot_${this.currentDepotId} `
      )
    );
  }

  /**
   * Get a relative time string (e.g., "2 days ago")
   * @param {number} timestamp - Unix timestamp in seconds
   * @returns {string} Relative time string
   */
  getRelativeTimeString(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    // Convert seconds to days/hours/minutes
    const days = Math.floor(diff / (60 * 60 * 24));
    const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((diff % (60 * 60)) / 60);

    if (days > 30) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return "just now";
    }
  }
}

module.exports = CLI;
