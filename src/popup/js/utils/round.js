/** Round a number to N decimal places. */
export function round(num, places) {
    return parseFloat(Number(num).toFixed(places));
}
