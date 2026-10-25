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
    return COURSES[Math.floor(Math.random() * COURSES.length)]!;
}

export function getRandomHexColor(): string {
    return `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0")}`;
}

export function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear();
    const hadBirthdayThisYear =
        now.getMonth() > birth.getMonth() ||
        (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    return hadBirthdayThisYear ? age : age - 1;
}
