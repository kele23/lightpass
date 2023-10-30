export const _t = (label: string, ...placeholders: string[]) => {
    if (!placeholders || placeholders.length == 0) return label;
    return label.replace(/{([0-9]+)}/g, function (match, index) {
        return typeof placeholders[index] === 'undefined' ? match : placeholders[index];
    });
};
