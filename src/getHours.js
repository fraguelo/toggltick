const { toggl } = require("./conf");
const { buildDate, formatDate, calculateDuration } = require("./lib");
const { getPrompts, datePrompt, descriptionPrompt } = require("./prompts");

let arrayBlocks;
let blocksToSave = [];
const STARTING_HOUR = 8;
const STOPPING_HOUR = 18;
const MID_STARTING_HOUR = 12;
const MID_STOPPING_HOUR = 14;
let pid;

function fromDateToObject(date) {
  const dateObject = new Date(date);
  return createHour(dateObject.getHours(), dateObject.getMinutes());
}

function fillArray(rawEntries) {
  return rawEntries.map((date) => {
    if (!pid) pid = date.pid;
    const start = fromDateToObject(date.start);
    const stop = fromDateToObject(date.stop);
    return { start, stop, flag: "saved" };
  });
}

function createHour(h, m) {
  return { h, m };
}

function createBlock(h, m = 0) {
  return { start: { h, m }, stop: {}, flag: "toSave" };
}

function getTimeEntries({ startDate, endDate }) {
  toggl.getTimeEntries(startDate, endDate, (err, rawEntries) => {
    if (err) {
      console.log("err :>> ", err);
      return;
    }

    arrayBlocks = fillArray(rawEntries);
    console.log("arrayBlocks :>> ", arrayBlocks);

    let tempHour = createBlock(STARTING_HOUR);

    for (let i = STARTING_HOUR; i <= STOPPING_HOUR; i++) {
      if (i === MID_STARTING_HOUR) {
        blocksToSave.push({
          ...tempHour,
          stop: createHour(MID_STARTING_HOUR, 00),
        });
        tempHour = createBlock(MID_STOPPING_HOUR);
      }

      if (i === STOPPING_HOUR) {
        blocksToSave.push({
          ...tempHour,
          stop: createHour(STOPPING_HOUR, 00),
        });
        break;
      }

      const hour = arrayBlocks.find(({ start: { h } }) => h === i);
      if (!!hour) {
        blocksToSave.push({
          ...tempHour,
          stop: createHour(hour.start.h, hour.start.m),
        });
        blocksToSave.push(hour);
        tempHour = createBlock(hour.stop.h, hour.stop.m);
      }
    }
    createEntries();
  });
}

function createEntries() {
  if (!pid) {
    console.log("Missing pid.");
    return;
  }
  blocksToSave
    .filter(({ flag }) => flag === "toSave")
    .forEach(({ start, stop }) => {
      const { endDate } = selectedDate;

      const entry = {
        start: formatDate(endDate, start),
        stop: formatDate(endDate, stop),
        duration: calculateDuration(
          formatDate(endDate, start),
          formatDate(endDate, stop)
        ),
        billable: true,
        pid,
        description,
        tags: ["2 - Development"],
      };
      console.log("entry :>> ", entry);
      toggl.createTimeEntry(entry, (err, entry) => {
        if (err) {
          console.log("err :>> ", err);
          return;
        }
      });
    });
}

let selectedDate;
let description;
async function start() {
  const response = await getPrompts([datePrompt /*, descriptionPrompt*/]);
  selectedDate = buildDate(response.date);
  description = /*response.description || */ "DEV-0000 - test";
  await getTimeEntries(selectedDate);
}

start();
