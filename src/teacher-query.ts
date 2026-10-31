import { filter, includes, isEmpty, isNil, orderBy, overEvery, partition, toLower, toNumber, trim } from "lodash-es";
import { Gender, Teacher } from "./teacher.js";

export type TeacherFilter = {
    country?: string;
    minAge?: number;
    maxAge?: number;
    gender?: Gender;
    favorite?: boolean;
    withPhoto?: boolean;
};

export function filterTeachers(teachers: Teacher[], teacherFilter: TeacherFilter): Teacher[] {
    const { country, minAge, maxAge, gender, favorite, withPhoto } = teacherFilter;
    const predicates: ((t: Teacher) => boolean)[] = [
        t => isNil(country) || t.country === country,
        t => isNil(minAge) || (!isNil(t.age) && t.age >= minAge),
        t => isNil(maxAge) || (!isNil(t.age) && t.age <= maxAge),
        t => isNil(gender) || t.gender === gender,
        t => isNil(favorite) || t.favorite === favorite,
        t => !withPhoto || !isNil(t.picture_large),
    ];
    const matches = overEvery(predicates);
    return filter(teachers, t => matches(t));
}

export type TeacherSortProp = 'full_name' | 'course' | 'age' | 'b_date' | 'country';

const SORT_SELECTORS: Record<TeacherSortProp, (t: Teacher) => string | number | undefined> = {
    full_name: t => toLower(t.full_name),
    course: t => toLower(t.course),
    age: t => t.age,
    b_date: t => isNil(t.b_date) ? undefined : new Date(t.b_date).getTime(),
    country: t => isNil(t.country) ? undefined : toLower(t.country),
};

// Missing values always go last, regardless of direction
export function sortTeachers(teachers: Teacher[], sortProp: TeacherSortProp, isDesc: boolean = false): Teacher[] {
    const selector = SORT_SELECTORS[sortProp];
    const [present, missing] = partition(teachers, t => !isNil(selector(t)));
    return [...orderBy(present, selector, isDesc ? "desc" : "asc"), ...missing];
}

// Matches by name or note substring (case-insensitive), or by exact age when query is a number
export function searchTeachers(teachers: Teacher[], query: string): Teacher[] {
    const q = toLower(trim(query));
    if (isEmpty(q)) {
        return teachers;
    }
    const age = /^\d+$/.test(q) ? toNumber(q) : undefined;
    return filter(teachers, t =>
        includes(toLower(t.full_name), q)
        || includes(toLower(t.note ?? ""), q)
        || (!isNil(age) && t.age === age));
}
