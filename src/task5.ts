import { Teacher } from "./task1.js";

export type FindTeacherPredicate = (t: Teacher) => boolean;

export type TeacherSearchQuery = {name?: string, note?: string, minAge?: number, maxAge?: number};

export function findTeacherByQuery(teachers: Teacher[], query: TeacherSearchQuery): Teacher | undefined {
    return findTeacherByPredicates(teachers, mapQueryToPredicates(query));
}

export function findTeacherByPredicates(teachers: Teacher[], predicates: FindTeacherPredicate[]): Teacher | undefined {
    return teachers.find(t => predicates.every(p => p(t)));
}

export function filterTeachersByQuery(teachers: Teacher[], query: TeacherSearchQuery): Teacher[] {
    return filterTeachersByPredicates(teachers, mapQueryToPredicates(query));
}

export function filterTeachersByPredicates(teachers: Teacher[], predicates: FindTeacherPredicate[]): Teacher[] {
    return teachers.filter(t => predicates.every(p => p(t)));
}

function mapQueryToPredicates(query: TeacherSearchQuery): FindTeacherPredicate[] {
    const {name, note, minAge, maxAge} = query;
    const predicates: FindTeacherPredicate[] = [];
    if(name != undefined) {
        predicates.push(byFullName(name));
    }
    if(note != undefined) {
        predicates.push(byNote(note));
    }
    if(minAge != undefined) {
        predicates.push(byMinAge(minAge));
    }
    if(maxAge != undefined) {
        predicates.push(byMaxAge(maxAge));
    }
    return predicates;
}

export function byFullName(q: string): FindTeacherPredicate {
    return (t: Teacher) => t.full_name.includes(q);
}

export function byNote(q: string): FindTeacherPredicate {
    return (t: Teacher) => t.note != undefined && t.note.includes(q);
}

export function byMinAge(q: number): FindTeacherPredicate {
    return (t: Teacher) => t.age != undefined && t.age >= q;
}

export function byMaxAge(q: number): FindTeacherPredicate {
    return (t: Teacher) => t.age != undefined && t.age <= q;
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
