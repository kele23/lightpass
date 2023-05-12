/**
 * Checks that an element has a non-empty `name`
 * @param  {Element} element  the element to check
 * @return {Bool}             true if the has a name
 */
const isValidElement = (element) => {
    return !!element.name;
};

/**
 * Checks that an element has a non-empty `value` property.
 * @param  {Element} element  the element to check
 * @return {Bool}             true if the element has a non empty value
 */
const hasValue = (element) => {
    return !!element.value;
};

/**
 * Checks if an element’s value can be saved (e.g. not an unselected checkbox).
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the value should be added, false if not
 */
const isValidValue = (element) => {
    return !['checkbox', 'radio'].includes(element.type) || element.checked;
};

/**
 * Checks if an input is a checkbox, because checkboxes allow multiple values.
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the element is a checkbox, false if not
 */
const isCheckbox = (element) => element.type === 'checkbox';

const isRadio = (element) => element.type === 'radio';

/**
 * Checks if an input is a `select` with the `multiple` attribute.
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the element is a multiselect, false if not
 */
const isMultiSelect = (element) => element.options && element.multiple;

/**
 * Retrieves the selected options from a multi-select as an array.
 * @param  {HTMLOptionsCollection} options  the options for the select
 * @return {Array}                          an array of selected option values
 */
const getSelectValues = (options) =>
    [].reduce.call(
        options,
        (values, option) => {
            return option.selected ? values.concat(option.value) : values;
        },
        []
    );

/**
 * Retrieves input data from a form and returns it as a JSON object.
 * @param  {HTMLFormControlsCollection} elements  the form elements
 * @param  {Boolean} includeEmpty                 include empty fields flag
 * @return {Object}                               form data as an object literal
 */
export const formToJSON = (elements, includeEmpty = false) => {
    return [].reduce.call(
        elements,
        (data, element) => {
            // Make sure the element has the required properties and should be added.
            if (isValidElement(element) && (hasValue(element) || includeEmpty) && isValidValue(element)) {
                /*
                 * Some fields allow for more than one value, so we need to check if this
                 * is one of those fields and, if so, store the values as an array.
                 */
                if (isCheckbox(element)) {
                    const value = element.value == 'true' ? true : element.value;
                    if (!data[element.name]) {
                        data[element.name] = value;
                    } else {
                        data[element.name] = [value].push(data[element.name]);
                    }
                } else if (isRadio(element)) {
                    data[element.name] = element.value == 'true' ? true : element.value;
                } else if (isMultiSelect(element)) {
                    data[element.name] = getSelectValues(element);
                } else {
                    data[element.name] = element.value;
                }
            }
            return data;
        },
        {}
    );
};

/**
 * Retrieves input data from a form and returns it as a JSON object.
 * @param  {HTMLFormControlsCollection} elements  the form elements
 * @parm {Object}                               json data as an object literal
 * @param {HTMLElement[]} ignore elements to ignore during form set
 */
export const jsonToForm = (form, json, ignore) => {
    for (const element of form.elements) {
        if (!isValidElement(element)) continue;
        if (ignore && ignore.indexOf(element) >= 0) continue;

        const name = element.name;
        const value =
            typeof json[name] == 'boolean' ? '' + json[name] : typeof json[name] == 'undefined' ? '' : json[name];
        if (isCheckbox(element)) {
            element.checked = value && element.value && (value == element.value || value.indexOf(element.value) >= 0);
        } else if (isRadio(element)) {
            element.checked = value && element.value && (value == element.value || value.indexOf(element.value) >= 0);
        } else if (isMultiSelect(element)) {
            element.options.each((option) => {
                option.selected = value == element.value || value.indexOf(option.value) >= 0;
            });
        } else {
            element.value = value;
        }
    }
};
