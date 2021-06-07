const fs = require("fs");
const TogglClient = require("toggl-api");
const Tickspot = require("tickspotv2-api");
const prompts = require("prompts");

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

let tasks = [];

function buildDate(date) {
  try {
    let amountDays = 1;
    if (date.includes("+")) {
      amountDays = Number(date.split("+")[1]);
      date = date.split("+")[0];
    }
    const spDate = date.split("-");
    const currentDate = new Date();
    const day = Number(spDate[0]);
    const month = spDate[1] ? Number(spDate[1]) - 1 : currentDate.getMonth();
    const year = spDate[2] || currentDate.getFullYear();
    const startDate = new Date(Date.UTC(year, month, day));
    const endDate = new Date(Date.UTC(year, month, day + amountDays));

    return { startDate, endDate };
  } catch (error) {
    console.error("Check the date format!");
  }
}

async function getTickTasks() {
  return (await tick.getTasks()).map(({ id, name }) => ({
    id,
    name,
  }));
}

function getTaskId(taskName) {
  return tasks.find(({ name }) => name === taskName).id;
}

function getTimeEntries({ startDate, endDate }) {
  toggl.getTimeEntries(startDate, endDate, (err, rawEntries) => {
    rawEntries.forEach(async ({ start, duration, description, tags, pid }) => {
      await toggl.getProjectData(pid, async (errProject, projectData) => {
        const { cid: clientId, name: projectName } = projectData;

        await toggl.getClientData(clientId, async (errClient, clientData) => {
          const { name: clientName = '' } = clientData || {};

          const entry = {
            task_id: getTaskId(tags[0]),
            notes: `[${clientName}/${projectName}] ${description}`,
            name: tags[0],
            hours: duration / 3600,
            date: start,
          };

          try {
            const { date, notes, hours } = await tick.createEntry(entry) || {};
            console.log("saved :>> ", { date, notes, hours });
          } catch (error) {
            console.error(`* ERROR (${entry.notes}): `, error.message);
          }
        });
      });
    });
  });
}

async function upload({ startDate, endDate }) {
  try {
    tasks = await getTickTasks();
    getTimeEntries({ startDate, endDate });
  } catch (error) {
    console.log("error :>> ", error);
  }
}

async function start() {
  const response = await prompts({
    type: "text",
    name: "date",
    message:
      "Insert a date in any format (dd, dd-mm,  dd-mm-yyyy) add '+' for amount of days (dd+5)",
  });
  upload(buildDate(response.date));
}

start();
