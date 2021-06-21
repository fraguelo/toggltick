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

function formatDate(date, { h, m }) {
  const formatedDate = new Date(date);
  formatedDate.setHours(h);
  formatedDate.setMinutes(m);
  return formatedDate;
}

function calculateDuration(start, stop) {
  return (stop.getTime() - start.getTime()) / 1000;
}

module.exports = { buildDate, formatDate, calculateDuration };
