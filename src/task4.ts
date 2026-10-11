import { Teacher } from "./task1.js";

export function sortTeachers(teachers: Teacher[], sortProp: 'full_name' | 'age' | 'b_date' | 'country', isDesc: boolean = false): Teacher[] {
    let comparator: (a: Teacher, b: Teacher) => number;

    if (sortProp === 'full_name') {
        comparator = (a, b) => a.full_name.localeCompare(b.full_name);
    } else if (sortProp === 'age') {
        comparator = (a, b) => compareMaybeUndefined(a, b, t => t.age, (l, r) => l - r);
    } else if (sortProp === 'b_date') {
        comparator = (a, b) => compareMaybeUndefined(a, b, t => t.b_date, (l, r) => new Date(l).getTime() - new Date(r).getTime());
    } else {
        comparator = (a, b) => compareMaybeUndefined(a, b, t => t.country, (l, r) => l.localeCompare(r));
    }

    if (isDesc) {
        const ascComparator = comparator;
        comparator = (a, b) => ascComparator(b, a);
    }

    return [...teachers].sort(comparator);
}

function compareMaybeUndefined<P>(a: Teacher, b: Teacher, selector: (t: Teacher) => P | undefined | null, comparator: (l: P, r: P) => number): number {
    const l = selector(a);
    const r = selector(b);
    if (l == undefined && r == undefined) return 0;
    if (l == undefined) return 1;
    if (r == undefined) return -1;
    return comparator(l, r);
}