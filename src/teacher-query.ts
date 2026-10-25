import { Gender, Teacher } from "./teacher.js";

export type TeacherFilter = {
    country?: string;
    minAge?: number;
    maxAge?: number;
    gender?: Gender;
    favorite?: boolean;
    withPhoto?: boolean;
};

export function filterTeachers(teachers: Teacher[], filter: TeacherFilter): Teacher[] {
    const { country, minAge, maxAge, gender, favorite, withPhoto } = filter;
    return teachers.filter(t => {
        return (country == undefined || t.country === country)
        && (minAge == undefined || (t.age != undefined && t.age >= minAge))
        && (maxAge == undefined || (t.age != undefined && t.age <= maxAge))
        && (gender == undefined || t.gender === gender)
        && (favorite == undefined || t.favorite === favorite)
        && (!withPhoto || t.picture_large != undefined);
    });
}

export type TeacherSortProp = 'full_name' | 'course' | 'age' | 'b_date' | 'country';

export function sortTeachers(teachers: Teacher[], sortProp: TeacherSortProp, isDesc: boolean = false): Teacher[] {
    const dir = isDesc ? -1 : 1;
    let comparator: (a: Teacher, b: Teacher) => number;

    if (sortProp === 'full_name') {
        comparator = (a, b) => dir * a.full_name.localeCompare(b.full_name);
    } else if (sortProp === 'course') {
        comparator = (a, b) => dir * a.course.localeCompare(b.course);
    } else if (sortProp === 'age') {
        comparator = (a, b) => compareMaybeUndefined(a, b, t => t.age, (l, r) => dir * (l - r));
    } else if (sortProp === 'b_date') {
        comparator = (a, b) => compareMaybeUndefined(a, b, t => t.b_date, (l, r) => dir * (new Date(l).getTime() - new Date(r).getTime()));
    } else {
        comparator = (a, b) => compareMaybeUndefined(a, b, t => t.country, (l, r) => dir * l.localeCompare(r));
    }

    return [...teachers].sort(comparator);
}

// Missing values always go last, regardless of direction
function compareMaybeUndefined<P>(a: Teacher, b: Teacher, selector: (t: Teacher) => P | undefined | null, comparator: (l: P, r: P) => number): number {
    const l = selector(a);
    const r = selector(b);
    if (l == undefined && r == undefined) return 0;
    if (l == undefined) return 1;
    if (r == undefined) return -1;
    return comparator(l, r);
}

// Matches by name or note substring (case-insensitive), or by exact age when query is a number
export function searchTeachers(teachers: Teacher[], query: string): Teacher[] {
    const q = query.trim().toLowerCase();
    if (q.length === 0) {
        return teachers;
    }
    const age = /^\d+$/.test(q) ? Number(q) : undefined;
    return teachers.filter(t =>
        t.full_name.toLowerCase().includes(q)
        || (t.note != undefined && t.note.toLowerCase().includes(q))
        || (age != undefined && t.age === age));
}

