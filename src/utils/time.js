
// Get current date time
/*
    @returns {string} - current date time
*/
export function getCurrentDateTime() {
  const d = new Date();

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

// Get date with current time
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
