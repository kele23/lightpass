import { RACES_TYPES } from '../interfaces/db.ts';
import { v4 as uuidv4 } from 'uuid';

////////////////////////////////////////////////////// UTILS
export const createKey = (type: string, value: string) => {
    return `${cleanKey(type)}!${cleanKey(value)}`;
};

export const cleanKey = (value: string) => {
    let result = value.replace(/\s+/g, '-');
    result = result.toLowerCase();
    return result.replace(/[^a-z0-9-]/g, '');
};

export const getFiltersForType = (type: RACES_TYPES) => {
    return { startkey: `${type}!`, endkey: `${type}!\ufff0` };
};

export const getMachineId = () => {
    let machineId = localStorage.getItem('MachineId');

    if (!machineId) {
        machineId = uuidv4();
        localStorage.setItem('MachineId', machineId);
    }
    return machineId;
};
