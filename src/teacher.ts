import dayjs from "dayjs";
import { padStart, random, sample } from "lodash-es";

export type Gender = "male" | "female";
export type Coordinates = { latitude: string; longitude: string };
export type Timezone = { offset: string; description: string };

export const COURSES = [
    "Mathematics",
    "Physics",
    "English",
    "Computer Science",
    "Dancing",
    "Chess",
    "Biology",
    "Chemistry",
    "Law",
    "Art",
    "Medicine",
    "Statistics",
] as const;

export type Course = (typeof COURSES)[number];

export interface Teacher {
    id: string;
    gender: Gender;
    title: string;
    full_name: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: number | string;
    coordinates?: Coordinates;
    timezone?: Timezone;
    email?: string;
    b_date?: string;
    age?: number;
    phone?: string;
    picture_large?: string;
    picture_thumbnail?: string;
    favorite: boolean;
    course: Course;
    bg_color: string;
    note: string | null;
}

export function getRandomCourse(): Course {
    return sample(COURSES) ?? COURSES[0];
}

export function getRandomHexColor(): string {
    return `#${padStart(random(0, 0xffffff).toString(16), 6, "0")}`;
}

export function calculateAge(birthDate: string): number {
    return dayjs().diff(dayjs(birthDate), "year");
}

export function daysUntilNextBirthday(birthDate: string): number {
    const today = dayjs().startOf("day");
    const birthdayThisYear = dayjs(birthDate).startOf("day").year(today.year());
    const next = birthdayThisYear.isBefore(today) ? birthdayThisYear.add(1, "year") : birthdayThisYear;
    return next.diff(today, "day");
}
