const axios = require("axios");
const logger = require("./logger");

const URL = "https://scatch-backend-api-s.onrender.com/";

function startSelfPing() {
  setInterval(async () => {
    try {
      await axios.get(URL);
      logger.info("Ping sent ✅ " + new Date().toLocaleTimeString());
    } catch (err) {
      logger.error("Ping failed ❌ " + err.message);
    }
  }, 5 * 60 * 1000); // every 5 min
}

module.exports = startSelfPing;
