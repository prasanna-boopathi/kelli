function getDateFromText(dateText) {
    const today = new Date();

    const text = dateText.toLowerCase().trim();

    if (text === "today") {
        return formatDate(today);
    }

    if (text === "tomorrow") {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        return formatDate(tomorrow);
    }

    if (text === "day after tomorrow") {
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);

        return formatDate(dayAfterTomorrow);
    }

    return dateText;
}

function formatDate(date) {
    return date.toISOString().split("T")[0];
}

module.exports = {
    getDateFromText
};