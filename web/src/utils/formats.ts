import { format } from 'date-fns';

export const datems = (data: any) => {
  if (!data) return '';

  const d = new Date(data);
  return format(d, 'yyyy-MM-dd HH:mm:ss SSS');
};

export const date = (data: any) => {
  if (!data) return '';

  const d = new Date(data);
  return format(d, 'yyyy-MM-dd HH:mm:ss');
};

export const onlyTime = (data: any) => {
  if (!data) return '';

  const d = new Date(data);
  return format(d, 'HH:mm:ss');
};

export const onlyTimeMs = (data: any) => {
  if (!data) return '';

  const d = new Date(data);
  return format(d, 'HH:mm:ss SSS');
};

export const diff = (data: any) => {
  if (!data) return;

  // ms
  let time = data as number;
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

  const str = `${String(finalHours).padStart(2, '0')}:${String(finalMin).padStart(2, '0')}:${String(finalSec).padStart(
    2,
    '0',
  )}`;

  return str + ' ' + String(finalMs).padStart(3, '0');
};
