import dayjs from "dayjs";
import { every, head, isEmpty, isString, replace, size, toLower, toUpper, trim, words } from "lodash-es";

const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isFirstCharCapitalLetter(str: string | undefined | null): boolean {
    if (!isString(str) || isEmpty(str)) {
        return false;
    }
    const ch = head(str) ?? "";
    // Capital letter won't change on toUpperCase.
    // If it is not a letter at all, it won't change on toLowerCase either.
    return ch !== toLower(ch) && ch === toUpper(ch);
}

export function isPhoneNumber(str: string | undefined | null): boolean {
    if (!isString(str)) {
        return false;
    }
    // Remove spaces, parentheses, dashes and dots
    return PHONE_REGEX.test(replace(str, /[\s().-]/g, ""));
}

export function isEmail(str: string | undefined | null): boolean {
    return isString(str) && EMAIL_REGEX.test(str);
}

export function isFullName(str: string | undefined | null): boolean {
    const parts = words(trim(str ?? ""), /\S+/g);
    return size(parts) >= 2 && every(parts, isFirstCharCapitalLetter);
}

export function isPastDate(str: string | undefined | null): boolean {
    const date = dayjs(str ?? "");
    return !isEmpty(str) && date.isValid() && date.isBefore(dayjs());
}
