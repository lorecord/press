export const parseISOWithTimezone = (iso: string) => {
    const date = new Date(iso);

    if (isNaN(date.getTime())) {
        return null;
    }

    const [, datePart, timezonePart] = iso.match(/(.+)([+-](?:\d{1,2}:?\d{1,2}|\d+)?|Z)$/) || [];

    let timezoneOffset = 0;
    if (timezonePart) {
        timezoneOffset = date.getTimezoneOffset();
    } else {
        timezoneOffset = (new Date(`${datePart}${timezonePart}`).getTime()
            - new Date(`${datePart}Z`).getTime()) / 60000;
    }

    return {
        date,
        datePart,
        timezonePart,
        timezoneOffset
    }
}