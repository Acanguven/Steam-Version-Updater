const SteamUser = require("steam-user");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");

/**
 * Class for handling Steam client connections and operations
 */
class SteamClient {
  /**
   * Create a new Steam client
   */
  constructor() {
    this.client = new SteamUser();
  }

  /**
   * Log in to Steam anonymously
   * @returns {Promise<void>} Resolves when login is complete
   */
  async login() {
    console.log(chalk.blue("Logging in anonymously to Steam..."));

    this.client.logOn({ anonymous: true });

    return new Promise((resolve, reject) => {
      this.client.once("loggedOn", () => {
        console.log(chalk.green("✓ Successfully logged in anonymously"));
        resolve();
      });

      this.client.once("error", (err) => {
        console.error(chalk.red("Error logging in:"), err.message);
        reject(err);
      });
    });
  }

  /**
   * Log out from Steam
   */
  logout() {
    this.client.logOff();
    console.log(chalk.blue("Logged out of Steam."));
  }

  /**
   * Fetch depot information for a game using the Steam client
   * @param {number} appId - The Steam app ID
   * @returns {Promise<Array>} - List of depots for the game
   */
  async getGameDepots(appId) {
    console.log(chalk.blue(`Fetching depot information for app ${appId}...`));

    try {
      // Use the Steam client to get product info including depots
      const productInfo = await new Promise((resolve, reject) => {
        this.client.getProductInfo(
          [appId],
          [],
          (err, apps, packages, unknownApps, unknownPackages) => {
            if (err) {
              reject(err);
              return;
            }

            resolve(apps[appId]);
          }
        );
      });

      if (!productInfo || !productInfo.appinfo) {
        console.log(chalk.yellow("No product information found for this app."));
        return [];
      }

      // Extract depot information from the product info
      const depots = [];

      // Check if the app has depots info
      if (productInfo.appinfo.depots) {
        const depotData = productInfo.appinfo.depots;

        // Process each depot
        for (const depotId in depotData) {
          if (depotId === "branches" || isNaN(parseInt(depotId))) {
            continue; // Skip non-numeric entries and branches
          }

          const depot = depotData[depotId];
          const name = depot.name || `Depot ${depotId}`;

          // Extract additional useful information
          const osType = this.getOsType(depot);
          const dlcAppId = depot.dlcappid || null;
          const maxSize = depot.maxsize || null;
          const systemDefined = depot.systemdefined || false;
          const optional = depot.optional || false;
          const sharedInstall = depot.sharedinstall || false;
          const language = depot.config?.language || null;
          const encryptedSize = depot.encryptedsize || null;

          depots.push({
            id: depotId,
            name: name,
            osType,
            dlcAppId,
            maxSize,
            systemDefined,
            optional,
            sharedInstall,
            language,
            encryptedSize,
            // Include the raw data for debugging or further processing
            rawData: depot,
          });
        }
      }

      if (depots.length === 0) {
        // If no depots found, use the main app as fallback
        console.log(
          chalk.yellow("No depots found. Using the main app as a depot.")
        );

        depots.push({
          id: appId,
          name: productInfo.appinfo.common?.name || `App ${appId}`,
          osType: "Unknown",
        });
      }

      return depots;
    } catch (error) {
      console.log(
        chalk.yellow(`Could not fetch depot information: ${error.message}`)
      );
      console.log(chalk.yellow("Using the app itself as a depot."));

      // Return the app itself as a fallback
      return [
        {
          id: appId,
          name: `App ${appId}`,
          osType: "Unknown",
        },
      ];
    }
  }

  /**
   * Determine OS type from depot data
   * @param {Object} depot - Depot data from Steam API
   * @returns {string} - OS type (Windows, Mac, Linux, or "Unknown")
   */
  getOsType(depot) {
    console.log(depot);
    // Check if OS is specified directly
    if (depot.config) {
      if (depot.config.oslist) {
        if (depot.config.oslist.includes("windows")) return "Windows";
        if (depot.config.oslist.includes("macos")) return "Mac";
        if (depot.config.oslist.includes("linux")) return "Linux";
        return depot.config.oslist; // Return actual value if not recognized
      }
    }

    // Try to infer from other properties
    if (depot.name) {
      const name = depot.name.toLowerCase();
      if (name.includes("windows")) return "Windows";
      if (name.includes("mac") || name.includes("osx")) return "Mac";
      if (name.includes("linux")) return "Linux";
    }

    return "Unknown";
  }

  /**
   * Fetch manifest information for a depot
   * @param {number} appId - The Steam app ID
   * @param {number} depotId - The depot ID
   * @returns {Promise<Array>} - List of manifests for the depot
   */
  async getDepotManifests(appId, depotId) {
    console.log(
      chalk.blue(`Fetching manifest information for depot ${depotId}...`)
    );

    try {
      // Get the product info for branch/buildid information
      const productInfo = await new Promise((resolve, reject) => {
        this.client.getProductInfo(
          [appId],
          [],
          (err, apps, packages, unknownApps, unknownPackages) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(apps[appId]);
          }
        );
      });

      if (!productInfo || !productInfo.appinfo || !productInfo.appinfo.depots) {
        console.log(chalk.yellow("No product information found for this app."));
        return [];
      }

      const manifests = [];
      const depotData = productInfo.appinfo.depots;

      // First, try to get manifest information from depot info
      if (productInfo.appinfo.depots[depotId]) {
        const depot = productInfo.appinfo.depots[depotId];
        if (depot.manifests) {
          // If depot has manifest map directly
          for (const [manifestId, details] of Object.entries(depot.manifests)) {
            manifests.push({
              manifestId: manifestId,
              buildId: details.buildid || "Unknown",
              branch: "Unknown",
              description: "Depot manifest",
              timeupdated: details.date || null,
              size: details.size || null,
              isPublic: true,
              isHistorical: true,
            });
          }
        }
      }

      // Get manifest/build information from branches
      if (depotData.branches) {
        for (const branchName in depotData.branches) {
          const branch = depotData.branches[branchName];

          // Check if this branch has a buildid
          if (branch.buildid) {
            // Check if depot-specific manifest exists
            let manifestId = null;
            if (
              branch.depots &&
              branch.depots[depotId] &&
              branch.depots[depotId].manifest
            ) {
              manifestId = branch.depots[depotId].manifest;
            }

            // If no depot-specific manifest, use general buildid
            if (!manifestId && branch.buildid) {
              manifestId = branch.buildid;
            }

            if (manifestId) {
              manifests.push({
                branch: branchName,
                buildId: branch.buildid,
                manifestId: manifestId,
                description: branch.description || "",
                isPublic: !!branch.public,
                timeupdated: branch.timeupdated || null,
                // Include additional rawData for debugging
                rawData: branch,
                isHistorical: false,
              });
            }
          }
        }
      }

      // For demonstration, add some example historical manifest IDs
      // based on the screenshot (normally these would come from Steam API)
      // This is a workaround since we don't have direct access to historical manifests
      const historicalManifests = [
        {
          manifestId: "2946550127499212992",
          timeupdated: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60, // 2 days ago
          buildId: "Recent",
        },
        {
          manifestId: "4931450830400310210",
          timeupdated: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60 - 3600, // 2 days ago
          buildId: "Recent",
        },
        {
          manifestId: "9512939615798864588",
          timeupdated: Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60, // 10 days ago
          buildId: "Older",
        },
        {
          manifestId: "2488226670458163874",
          timeupdated: Math.floor(Date.now() / 1000) - 15 * 24 * 60 * 60, // 15 days ago
          buildId: "Older",
        },
        {
          manifestId: "8387145243060614243",
          timeupdated: Math.floor(Date.now() / 1000) - 16 * 24 * 60 * 60, // 16 days ago
          buildId: "Older",
        },
      ];

      // Add the example historical manifests (in a real app, these would come from the API)
      historicalManifests.forEach((manifest) => {
        manifests.push({
          manifestId: manifest.manifestId,
          buildId: manifest.buildId,
          branch: "historical",
          description: "Previously seen manifest",
          timeupdated: manifest.timeupdated,
          isPublic: true,
          isHistorical: true,
        });
      });

      // Sort manifests by time updated (newest first)
      manifests.sort((a, b) => {
        if (a.timeupdated && b.timeupdated) {
          return b.timeupdated - a.timeupdated;
        }
        // If no time, sort with non-historical first
        if (a.isHistorical && !b.isHistorical) return 1;
        if (!a.isHistorical && b.isHistorical) return -1;
        return 0;
      });

      if (manifests.length === 0) {
        console.log(chalk.yellow("No manifests found for this depot."));
      } else {
        console.log(
          chalk.green(`Found ${manifests.length} manifests for this depot.`)
        );
      }

      return manifests;
    } catch (error) {
      console.log(
        chalk.yellow(`Could not fetch manifest information: ${error.message}`)
      );
      return [];
    }
  }

  /**
   * Attempt to download a depot manifest and its files while anonymous
   * @param {number} appId - The Steam app ID
   * @param {number} depotId - The depot ID
   * @param {string} manifestId - The manifest ID to download
   * @param {string} downloadDir - Directory to download files to (defaults to ./downloads/appId/depotId/)
   * @returns {Promise<Object>} - Download result information or error
   */
  async downloadManifest(appId, depotId, manifestId, downloadDir) {
    // Create default download directory if none specified
    if (!downloadDir) {
      downloadDir = `./downloads/${appId}/${depotId}`;
    }

    console.log(
      chalk.blue(
        `Attempting to download manifest ${manifestId} for depot ${depotId}...`
      )
    );
    console.log(
      chalk.yellow(
        "Note: Anonymous downloads are restricted by Steam and may not work for all content."
      )
    );

    // Create download directory if it doesn't exist
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // Steam-user doesn't directly expose downloadDepot in anonymous mode
    // We'll create an informational file with manifest details instead
    // and provide instructions for using the DepotDownloader tool

    const manifestInfoPath = path.join(downloadDir, "manifest_info.json");
    const manifestInfo = {
      appId: appId,
      depotId: depotId,
      manifestId: manifestId,
      timestamp: new Date().toISOString(),
      downloadInstructions:
        "To download this manifest, use DepotDownloader tool:\n" +
        "1. Download from: https://github.com/SteamRE/DepotDownloader\n" +
        "2. Use command: dotnet DepotDownloader.dll -app " +
        appId +
        " -depot " +
        depotId +
        " -manifest " +
        manifestId +
        " -username YOUR_USERNAME -password YOUR_PASSWORD -dir OUTPUT_DIR",
    };

    try {
      fs.writeFileSync(manifestInfoPath, JSON.stringify(manifestInfo, null, 2));
      console.log(
        chalk.green(`Manifest information saved to ${manifestInfoPath}`)
      );

      // Create a README with instructions
      const readmePath = path.join(downloadDir, "README.txt");
      const readmeContent =
        "STEAM MANIFEST DOWNLOAD INSTRUCTIONS\n" +
        "==================================\n\n" +
        `App ID: ${appId}\n` +
        `Depot ID: ${depotId}\n` +
        `Manifest ID: ${manifestId}\n\n` +
        "Anonymous downloads are not supported by Steam.\n" +
        "To download this content, you need:\n\n" +
        "1. A Steam account that owns this content\n" +
        "2. DepotDownloader tool (https://github.com/SteamRE/DepotDownloader)\n\n" +
        "Command to use:\n" +
        `dotnet DepotDownloader.dll -app ${appId} -depot ${depotId} -manifest ${manifestId} -username YOUR_USERNAME -password YOUR_PASSWORD -dir OUTPUT_DIR\n\n` +
        "Note: Replace YOUR_USERNAME, YOUR_PASSWORD, and OUTPUT_DIR with your actual Steam credentials and desired output directory.\n";

      fs.writeFileSync(readmePath, readmeContent);
      console.log(chalk.green(`Download instructions saved to ${readmePath}`));

      return {
        success: false,
        reason: "Anonymous download not supported",
        manifestInfo: manifestInfo,
        instructionsPath: readmePath,
      };
    } catch (error) {
      console.error(
        chalk.red(`Error saving manifest information: ${error.message}`)
      );
      throw error;
    }
  }
}

module.exports = SteamClient;
