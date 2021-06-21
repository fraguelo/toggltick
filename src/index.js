const { toggl, tick } = require("./conf");
const { buildDate } = require("./lib");
const { getPrompts, datePrompt } = require("./prompts");

let tasks = [];

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
    rawEntries.forEach(async ({ start, duration, description, tags }) => {
      const entry = {
        task_id: getTaskId(tags[0]),
        notes: description,
        name: tags[0],
        hours: duration / 3600,
        date: start,
      };

      const { date, notes, hours } = await tick.createEntry(entry);
      console.log("saved :>> ", { date, notes, hours });
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
  const { date } = await getPrompts([datePrompt]);
  upload(buildDate(date));
}

start();
