/**
 * Checks that an element has a non-empty `name`
 * @param  {Element} element  the element to check
 * @return {Bool}             true if the has a name
 */
const isValidElement = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
  return !!element.name;
};

/**
 * Checks that an element has a non-empty `value` property.
 * @param  {Element} element  the element to check
 * @return {Bool}             true if the element has a non empty value
 */
const hasValue = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
  return !!element.value;
};

/**
 * Checks if an element’s value can be saved (e.g. not an unselected checkbox).
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the value should be added, false if not
 */
const isValidValue = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
  return !['checkbox', 'radio'].includes(element.type) || (element as HTMLInputElement).checked;
};

/**
 * Checks if an input is a checkbox, because checkboxes allow multiple values.
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the element is a checkbox, false if not
 */
const isCheckbox = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => element.type === 'checkbox';

const isRadio = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => element.type === 'radio';

/**
 * Checks if an input is a `select` with the `multiple` attribute.
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the element is a multiselect, false if not
 */
const isMultiSelect = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
  if (element.tagName == 'select') {
    const select = element as HTMLSelectElement;
    return select.options && select.multiple;
  }
  return false;
};

/**
 * Retrieves the selected options from a multi-select as an array.
 * @param  {HTMLOptionsCollection} options  the options for the select
 * @return {Array}                          an array of selected option values
 */
const getSelectValues = (options: HTMLOptionsCollection) => {
  const values = [] as string[];
  for (const option of options) {
    if (option.selected) values.push(option.value);
  }
  return values;
};

/**
 *
 * @param elements
 * @param includeEmpty
 * @returns
 */
export const formToJSON = (elements: HTMLFormControlsCollection, includeEmpty = false) => {
  let data = {} as any;

  for (const el of elements) {
    const element = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
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
      } else if (isMultiSelect(element as HTMLSelectElement)) {
        const select = element as HTMLSelectElement;
        data[element.name] = getSelectValues(select.options);
      } else {
        data[element.name] = element.value;
      }
    }
  }

  return data;
};

export const jsonToForm = (form: HTMLFormElement, json: Record<string, any>, ignore?: HTMLElement[]) => {
  for (const el of Array.from(form.elements)) {
    const element = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    // 1. Validazione iniziale
    if (!element.name || (ignore && ignore.includes(element))) continue;

    const name = element.name;
    const value = json[name];

    // Se il valore nel JSON è nullo o indefinito, passiamo oltre o resettiamo
    if (value === undefined || value === null) continue;

    // 2. Gestione Checkbox e Radio
    if (element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')) {
      if (Array.isArray(value)) {
        element.checked = value.map(String).includes(String(element.value));
      } else if (typeof value === 'boolean') {
        element.checked = value;
      } else {
        element.checked = String(value) === String(element.value);
      }
    }

    // 3. Gestione Select Multiplo
    else if (element instanceof HTMLSelectElement && element.multiple) {
      const values = Array.isArray(value) ? value.map(String) : [String(value)];
      for (const option of Array.from(element.options)) {
        option.selected = values.includes(option.value);
      }
    }

    // 4. Input standard (text, date, email, select-one, textarea)
    else {
      element.value = value;
    }
  }
};
