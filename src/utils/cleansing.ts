/**
 * Data Cleansing Utilities for GUC Matchmaking & Dating Platform
 */

/**
 * Parses age string or number.
 * - If integer, validates it is between 18 and 99.
 * - If Date string (e.g., DD/MM/YYYY), calculates age dynamically.
 */
export function parseAge(val: any): number {
  if (val === undefined || val === null || val === '') {
    throw new Error("Age value is empty");
  }
  
  // Normalize dashes and spaces to slashes
  const str = String(val).trim().replace(/[-\s]/g, '/');
  
  // Try to parse as integer first
  const intVal = parseInt(str, 10);
  if (!isNaN(intVal) && /^\d+$/.test(str)) {
    if (intVal >= 18 && intVal <= 99) {
      return intVal;
    }
    throw new Error(`Age must be between 18 and 99. Got: ${intVal}`);
  }
  
  // Try to parse as Date string in DD/MM/YYYY format
  const dateParts = str.split('/');
  if (dateParts.length === 3) {
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
    const year = parseInt(dateParts[2], 10);
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const birthDate = new Date(year, month, day);
      // Validate calendar date to avoid silent JS date rollovers (e.g. 31/02/1998 -> 03/03/1998)
      if (birthDate.getFullYear() === year && birthDate.getMonth() === month && birthDate.getDate() === day) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age >= 18 && age <= 99) {
          return age;
        }
        throw new Error(`Calculated age from DOB ${str} is ${age}, which is not between 18 and 99`);
      }
    }
  }
  
  // Fallback general Date parsing
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    const today = new Date();
    let age = today.getFullYear() - parsedDate.getFullYear();
    const monthDiff = today.getMonth() - parsedDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedDate.getDate())) {
      age--;
    }
    if (age >= 18 && age <= 99) {
      return age;
    }
    throw new Error(`Calculated age from DOB ${str} is ${age}, which is not between 18 and 99`);
  }
  
  throw new Error(`Could not parse age or date of birth: ${str}`);
}

/**
 * Robust GUC ID sanitization.
 * Extracts the 2-digit cohort code and the remaining ID if a 'YY-XXXX' pattern is found anywhere.
 * E.g., "Can’t remember 40-" becomes "40-", "28-869" remains "28-869".
 */
export function sanitizeGucId(gucId: string): string {
  const trimmed = gucId.trim().replace(/[\s_/]/g, '-');
  const match = trimmed.match(/(\d{2}-.*)/);
  if (match) {
    return match[1];
  }
  return trimmed;
}

/**
 * Validates GUC ID against the relaxed constraint starting with two digits and a dash.
 */
export function validateGucId(gucId: string): boolean {
  const sanitized = sanitizeGucId(gucId);
  return /^\d{2}-.*$/.test(sanitized);
}

/**
 * Validates custom candidate codes to ensure they start strictly with 'L' or 'G' followed by numbers.
 */
export function validateCandidateCode(code: string): boolean {
  return /^[LG]\d+$/i.test(code.trim());
}

/**
 * Sanitizes candidate codes.
 * Removes non-digits following the 'L' or 'G' prefix. Sanitizes e.g., 'L!6' to 'L6'.
 */
export function sanitizeCandidateCode(code: string): string {
  const trimmed = code.trim().toUpperCase();
  if (trimmed.length === 0) return '';
  const prefix = trimmed[0];
  if (prefix !== 'L' && prefix !== 'G') {
    // Attempt to search for L or G in the string
    const foundL = trimmed.indexOf('L');
    const foundG = trimmed.indexOf('G');
    if (foundL !== -1 && (foundG === -1 || foundL < foundG)) {
      const digits = trimmed.slice(foundL + 1).replace(/\D/g, '');
      return `L${digits}`;
    } else if (foundG !== -1) {
      const digits = trimmed.slice(foundG + 1).replace(/\D/g, '');
      return `G${digits}`;
    }
    return '';
  }
  const digits = trimmed.slice(1).replace(/\D/g, '');
  return `${prefix}${digits}`;
}

/**
 * Recursively cleans and removes/replaces `undefined` values in payload objects for Firestore.
 * Firestore crashes when values are `undefined`. Replaces with `null` or deletes key.
 */
export function sanitizeFirestorePayload(obj: any): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeFirestorePayload(item));
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          newObj[key] = sanitizeFirestorePayload(val);
        }
      }
    }
    return newObj;
  }
  return obj;
}
