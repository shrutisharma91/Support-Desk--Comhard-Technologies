import { validation } from './errors.js';

export function parseId(param: string): number {
  if (!/^\d+$/.test(param)) {
    throw validation('Validation failed', { id: 'Id must be a positive integer' });
  }
  const id = Number(param);
  if (!Number.isInteger(id) || id < 1) {
    throw validation('Validation failed', { id: 'Id must be a positive integer' });
  }
  return id;
}
