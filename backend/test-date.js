const { getDateFromText } = require("./dateUtils");

console.log("Today:", getDateFromText("today"));
console.log("Tomorrow:", getDateFromText("tomorrow"));
console.log(
    "Day after tomorrow:",
    getDateFromText("day after tomorrow")
);