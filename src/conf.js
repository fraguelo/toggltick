const fs = require("fs");

const TogglClient = require("toggl-api");
const Tickspot = require("tickspotv2-api");

const {
  TOGGL_API_TOKEN,
  TICK_USER_AGENT,
  TICK_SUBSCRIPTION_ID,
  TICK_API_TOKEN,
} = JSON.parse(fs.readFileSync("conf.json"));

const toggl = new TogglClient({ apiToken: TOGGL_API_TOKEN });
const tick = new Tickspot(
  TICK_USER_AGENT,
  TICK_SUBSCRIPTION_ID,
  TICK_API_TOKEN
);

module.exports = { toggl, tick };
