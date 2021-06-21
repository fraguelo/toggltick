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

function getHour(date) {
  return { hour: date.getUTCHours(), minute: date.getMinutes() };
}

// const INITIAL_HOUR = 8;
// let description = "[DEV-7412] External PCP Forms - UI Bugs and Suggestions";
const entries = [];
let pid;
// function getTimeEntries({ startDate, endDate }) {
//   entries.push({
//     start: { hour: 13, minute: 0 },
//     stop: { hour: 14, minute: 30 },
//   });

//   toggl.getTimeEntries(startDate, endDate, (err, rawEntries) => {
//     if (err) {
//       console.log("err :>> ", err);
//       return;
//     }

//     rawEntries.forEach(({ start, stop, pid: projectId, description, tags }) => {
//       if (!pid) pid = projectId;
//       if (entries.length === 1) {
//         entries[0].stop = getHour(new Date(start));
//       }
//       if (Number(getHour(new Date(start)).hour) > 17) {
//         entries.push({
//           start: entries[entries.length - 1].stop,
//           stop: { hour: 17, minute: 0 },
//         });
//       }

//       entries.push({
//         description: "remove",
//         start: getHour(new Date(start)),
//         stop: getHour(new Date(stop)),
//       });
//     });

//     entries.push({
//       start: { hour: 19, minute: 0 },
//       stop: { hour: 23, minute: 0 },
//     });

//     console.log(
//       "entries :>> ",
//       entries.filter((entry) => !entry.description)
//     );
//     createEntries();
//   });
// }

function getTimeEntries({ startDate, endDate }) {
  toggl.getTimeEntries(startDate, endDate, (err, rawEntries) => {
    if (err) {
      console.log("err :>> ", err);
      return;
    }

    rawEntries.forEach(({ pid: projectId }) => {
      if (!pid) pid = projectId;
    });

    if (!pid) console.error("PID was not specified");

    entries.push({
      start: { hour: 13, minute: 0 },
      stop: { hour: 14, minute: 30 },
    });

    entries.push({
      start: { hour: 14, minute: 50 },
      stop: { hour: 17, minute: 00 },
    });

    entries.push({
      start: { hour: 19, minute: 0 },
      stop: { hour: 23, minute: 0 },
    });

    createEntries();
  });
}

function formatDate(date, { hour, minute }) {
  const formatedDate = new Date(date);
  formatedDate.setHours(hour - 5);
  formatedDate.setMinutes(minute);
  return formatedDate;
}

function calculateDuration(start, stop) {
  return (stop.getTime() - start.getTime()) / 1000;
}

function createEntries() {
  entries
    .filter((entry) => !entry.description)
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
      //   console.log("entry :>> ", entry);
      toggl.createTimeEntry(entry, (err, entry) => {
        if (err) {
          console.log("err :>> ", err);
          return;
        }
        console.log("entry :>> ", entry);
      });
    });
}

let selectedDate;
async function start() {
  const { date, ticketDescription } = await prompts([
    {
      type: "text",
      name: "date",
      message: "Insert a date in any format (dd, dd-mm,  dd-mm-yyyy)",
    },
    {
      type: "text",
      name: "ticketDescription",
      message: "Insert ticket description ([DEV-0000] ...)",
    },
  ]);
  description = ticketDescription || "Test";
  selectedDate = buildDate(date);
  await getTimeEntries(selectedDate);
}

start();
