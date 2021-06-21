const prompts = require("prompts");

const datePrompt = {
  type: "text",
  name: "date",
  message:
    "Insert a date in any format (dd, dd-mm,  dd-mm-yyyy) add '+' for amount of days (dd+5)",
};

const descriptionPrompt = {
  type: "text",
  name: "ticketDescription",
  message: "Insert ticket description ([DEV-0000] ...)",
};

async function getPrompts(arrayPrompts) {
  return await prompts(arrayPrompts);
}

module.exports = { getPrompts, datePrompt, descriptionPrompt };
