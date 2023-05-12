export const msToStr = (ms, withMs = false) => {
    if (!ms) return;
    const date = new Date(ms);
    const str = date.toLocaleString('it-IT');
    if (withMs) {
        return str + ' ' + String(date.getMilliseconds()).padStart(3, '0');
    }
    return str;
};

export const msToTime = (ms, withMs = false) => {
    if (!ms) return;

    const date = new Date(ms);
    const str = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(
        date.getSeconds()
    ).padStart(2, '0')}`;
    if (withMs) {
        return str + ' ' + String(date.getMilliseconds()).padStart(3, '0');
    }
    return str;
};

export const msToDiffTimeStr = (ms, withMs = false) => {
    if (!ms) return;

    // ms
    let time = ms;
    const finalMs = time % 1000;
    time = (time - finalMs) / 1000;

    // seconds
    const finalSec = time % 60;
    time = (time - finalSec) / 60;

    // minutes
    const finalMin = time % 60;
    time = (time - finalMin) / 60;

    // hours
    const finalHours = time;

    const str = `${String(finalHours).padStart(2, '0')}:${String(finalMin).padStart(2, '0')}:${String(
        finalSec
    ).padStart(2, '0')}`;
    if (withMs) {
        return str + ' ' + String(finalMs).padStart(3, '0');
    }
    return str;
};
