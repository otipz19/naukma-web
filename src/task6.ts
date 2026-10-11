import { Teacher } from "./task1.js";
import { filterTeachersByQuery, TeacherSearchQuery } from "./task5.js";

// Returns [0, 100] with decimal part
export function calcFilteredTeachersPercentage(teachers: Teacher[], query: TeacherSearchQuery): number {
    if(teachers.length === 0) {
        return 0;
    }

    const filtered = filterTeachersByQuery(teachers, query);
    return 100 * filtered.length / teachers.length;
}