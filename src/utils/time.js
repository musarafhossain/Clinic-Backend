
// Get current date time
/*
    @returns {string} - current date time
*/
export function getCurrentDateTime() {
    // Return current date time
    return new Date().toLocaleTimeString();
}

// Get MySQL date with current time
/*
    @param {string} dateOnly - Date only
    @returns {string} - MySQL date with current time
*/
export function dateWithCurrentTime(dateOnly) {
    // Get current date and time
    const now = new Date();

    // Get date
    const date = new Date(dateOnly);

    // Set hours, minutes and seconds
    date.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
    );

    // Return MySQL date with current time
    return date.toISOString().slice(0, 19).replace('T', ' ');
}
