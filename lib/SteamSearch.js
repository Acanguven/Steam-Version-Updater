const axios = require("axios");
const chalk = require("chalk");

/**
 * Class for searching games on the Steam platform
 */
class SteamSearch {
  /**
   * Create a new Steam search instance
   */
  constructor() {
    this.apiUrl = "https://store.steampowered.com/api/storesearch";
    this.headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      Accept: "application/json",
    };
  }

  /**
   * Search for games by name
   * @param {string} searchTerm - The term to search for
   * @returns {Promise<Array>} - List of matching applications
   */
  async searchGames(searchTerm) {
    console.log(chalk.blue(`Searching for games matching: ${searchTerm}`));

    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          term: searchTerm,
          l: "english",
          cc: "US",
        },
        headers: this.headers,
      });

      if (
        !response.data ||
        !response.data.items ||
        response.data.items.length === 0
      ) {
        console.log(chalk.yellow("No matching games found."));
        return [];
      }

      return response.data.items.map((item) => ({
        appid: item.id,
        name: item.name,
        type: item.type,
        price: item.price ? item.price.final / 100 : 0,
        discount: item.price ? item.price.discount_percent : 0,
        image: item.tiny_image,
      }));
    } catch (error) {
      console.error(chalk.red("Error searching Steam:"), error.message);
      throw error;
    }
  }
}

module.exports = SteamSearch;
