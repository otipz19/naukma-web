import { Gender } from "./FE4U-Lab2-mock.js";
import { Teacher } from "./task1.js";

export function filterTeachers(teachers: Teacher[], country?: string, age?: number, gender?: Gender, favorite?: boolean): Teacher[] {
    return teachers.filter(t => {
        return (country == undefined || t.country === country)
        && (age == undefined || t.age === age)
        && (gender == undefined || t.gender === gender)
        && (favorite == undefined || t.favorite === favorite);
    });
}