///////////////////////////////////////////////////
//////////// PROMISIFY EVENT
///////////////////////////////////////////////////
export const buildWaitForEvent = (eventName) => (node) =>
    new Promise((resolve, reject) => {
        // reject for invalid node
        if (!(node instanceof window.HTMLElement || node instanceof window.SVGElement)) {
            return reject(new Error('tail-end: an HTML or SVG element is required.'));
        }

        // create the event handler
        const handler = (event) => {
            // unbind the handler
            node.removeEventListener(eventName, handler);
            // resolve the (now clean) node
            return resolve(event);
        };

        // bind the handler
        node.addEventListener(eventName, handler);
    });

///////////////////////////////////////////////////
//////////// PROMISIFY ANIMATIONEND - TRANSITIONEND
///////////////////////////////////////////////////
export const animationEnd = buildWaitForEvent('animationend');
export const transitionEnd = buildWaitForEvent('transitionend');

///////////////////////////////////////////////////
//////////// DELAY
///////////////////////////////////////////////////
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

///////////////////////////////////////////////////
//////////// NEXT PREV SIBLINGS
///////////////////////////////////////////////////
export const getNextSibling = function (elem, selector) {
    // Get the next sibling element
    var sibling = elem.nextElementSibling;

    // If there's no selector, return the first sibling
    if (!selector) return sibling;

    // If the sibling matches our selector, use it
    // If not, jump to the next sibling and continue the loop
    while (sibling) {
        if (sibling.matches && sibling.matches(selector)) return sibling;
        sibling = sibling.nextElementSibling;
    }
};

export const getPrevSibling = function (elem, selector) {
    // Get the next sibling element
    var sibling = elem.previousElementSibling;

    // If there's no selector, return the first sibling
    if (!selector) return sibling;

    // If the sibling matches our selector, use it
    // If not, jump to the next sibling and continue the loop
    while (sibling) {
        if (sibling.matches && sibling.matches(selector)) return sibling;
        sibling = sibling.previousElementSibling;
    }
};

export const getNextSiblingAll = function (elem, selector) {
    // Get the next sibling element
    let sibling = elem.nextElementSibling;
    let result = [];
    // If the sibling matches our selector, use it
    // If not, jump to the next sibling and continue the loop
    while (sibling) {
        if (sibling.matches && sibling.matches(selector)) result.push(sibling);
        sibling = sibling.nextElementSibling;
    }
    return result;
};

export const getPrevSiblingAll = function (elem, selector) {
    // Get the next sibling element
    let sibling = elem.previousElementSibling;
    let result = [];
    // If the sibling matches our selector, use it
    // If not, jump to the next sibling and continue the loop
    while (sibling) {
        if (sibling.matches && sibling.matches(selector)) result.push(sibling);
        sibling = sibling.previousElementSibling;
    }
    return result;
};

///////////////////////////////////////////////////
//////////// FIRST AND LAST CHILD
///////////////////////////////////////////////////
export const getFirstChild = function (elem, selector) {
    // Get the first child element
    var nodes = elem.children;
    if (nodes.length <= 0) return;

    // If there's no selector, return the first sibling
    if (!selector) return nodes[0];

    // If the child node matches our selector, use it
    // If not, jump to the next child and continue the loop
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].matches && nodes[i].matches(selector)) return nodes[i];
    }
};

export const getLastChild = function (elem, selector) {
    // Get the last child element
    var nodes = elem.children;
    if (nodes.length <= 0) return;

    // If there's no selector, return the last sibling
    if (!selector) return nodes[nodes.length - 1];

    // If the child node matches our selector, use it
    // If not, jump to the prev child and continue the loop
    for (let i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].matches && nodes[i].matches(selector)) return nodes[i];
    }
};

export const getClosestAll = function (elem, selector) {
    const closestOne = (el, arr) => {
        if (!el) return arr;

        const clo = el.closest(selector);
        if (!clo) return arr;

        return closestOne(clo.parentElement, [clo, ...arr]);
    };

    return closestOne(elem, []);
};

///////////////////////////////////////////////////
//////////// CREATE QUERY PARAMETERS
///////////////////////////////////////////////////
export const buildQuery = (obj) =>
    Object.entries(obj)
        .map((pair) => pair.map(encodeURIComponent).join('='))
        .join('&');

///////////////////////////////////////////////////
//////////// HTML ELEMENTS
///////////////////////////////////////////////////
export const htmlToElement = (html) => {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
};

export const emptyElement = (element) => {
    while (element.firstChild) {
        element.removeChild(element.lastChild);
    }
};

///////////////////////////////////////////////////
//////////// OTHERS
///////////////////////////////////////////////////
export const isPositive = (value) => {
    if (value == true || value == 'true' || value == 'S' || value == 's' || value == '1') {
        return true;
    }
    return false;
};

/**
 * Check if an object is null or empty
 * @param {*} obj
 * @returns
 */
export const isObjectEmpty = (obj) => {
    return !obj || (Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype);
};

///////////////////////////////////////////////////
//////////// DEBOUNCE
///////////////////////////////////////////////////
export const debounce = (cb, delay = 1000) => {
    let timeoutId = null;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            cb.apply(null, args);
        }, delay);
    };
};

///////////////////////////////////////////////////
//////////// MAKE ID
///////////////////////////////////////////////////
export const makeid = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

///////////////////////////////////////////////////
//////////// TIME INSTANT
///////////////////////////////////////////////////
export const timeInstant = (formattedHour) => {
    let t0 = new Date();
    let t0split = formattedHour.split(':');
    t0.setHours(parseInt(t0split[0]));
    t0.setMinutes(parseInt(t0split[1]));
    return t0;
};

/**
 *
 * @param {String} text
 * @returns Convert a text to url friendly
 */
export const toUrlFriendly = (text) => {
    let result = text
        .normalize('NFD')
        .trim()
        .toLowerCase()
        .replaceAll(/\s|[//_:]/g, '-')
        .replaceAll('[^a-z0-9-]', '');
    return result.length > 150 ? result.substring(0, 150) : result;
};

/**
 *
 * @returns true if referrer comes from current domain
 */
export const isReferrerCurrentDomain = () => {
    if (!document.referrer) return false;
    try {
        const referrer = new URL(document.referrer);
        return referrer.origin === location.origin;
    } catch (e) {
        console.info('Cannot check referrer');
    }
    return false;
};

export const isInViewport = function (el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

///////////////////////////////////////////////////
//////////// CALCULATE OVERLAY POSITION
///////////////////////////////////////////////////
export const calcTop = (self, target, offset = 0) => {
    const rect = target.getBoundingClientRect();
    const popHeight = self.clientHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    let top = rect.top + scrollTop + rect.height + 8;
    if (top + popHeight > document.documentElement.scrollHeight) {
        const diff = top + popHeight - document.documentElement.scrollHeight;
        top = top - diff - 8;
        top = top >= 0 ? top : 0;
    }
    return top + offset + 'px';
};

export const calcLeft = (self, target, offset = 0) => {
    const rect = target.getBoundingClientRect();
    const popWidth = self.clientWidth;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    let left = rect.left + scrollLeft;
    if (left + popWidth > document.documentElement.scrollWidth) {
        const diff = left + popWidth - document.documentElement.scrollWidth;
        left = left - diff - 8;
        left = left >= 0 ? left : 0;
    }
    return left + offset + 'px';
};

///////////////////////////////////////////////////
//////////// DEEP MERGE
///////////////////////////////////////////////////
export const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item);
};

export const mergeDeep = (target, ...sources) => {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key])
                    Object.assign(target, {
                        [key]: {},
                    });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, {
                    [key]: source[key],
                });
            }
        }
    }

    return mergeDeep(target, ...sources);
};

///////////////////////////////////// FILE READ
export const readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = reject;

        reader.readAsArrayBuffer(file);
    });
};

////////////////////////////////////////
export const dateToStr = (ms, withMs = false) => {
    if (!ms) return;
    const date = new Date(ms);
    const str = date.toLocaleString();
    if (withMs) {
        return str + ' ' + String(date.getMilliseconds()).padStart(3, '0');
    }
    return str;
};

export const dateToTime = (ms, withMs = false) => {
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

export const dateToDiffTimeStr = (ms, withMs = false) => {
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
