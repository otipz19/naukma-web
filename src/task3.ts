import { Gender } from "./FE4U-Lab2-mock.js";
import { Teacher } from "./task1.js";

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
