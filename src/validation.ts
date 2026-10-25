export function isFirstCharCapitalLetter(str: string | undefined | null): boolean {
    if (str == undefined || str.length <= 0) {
        return false;
    }
    const ch = str.charAt(0);
    // Capital letter won't change on toUpperCase.
    // If it is not a letter at all, it won't change on toLowerCase either.
    return ch === ch.toUpperCase() && ch !== ch.toLowerCase();
}

export function isPhoneNumber(str: string | undefined | null): boolean {
    if (str == undefined) {
        return false;
    }
    // Remove spaces, parentheses, dashes and dots
    str = str.replace(/[\s().-]/g, "");
    const regex = /^\+[1-9]\d{1,14}$/;
    return regex.test(str);
}

export function isEmail(str: string | undefined | null): boolean {
    if (str == undefined) {
        return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(str);
}
