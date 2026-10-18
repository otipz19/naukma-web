import { RandomUser, AdditionalUser, RANDOM_USER_MOCK, ADDITIONAL_USERS, Gender, Coordinates, Timezone } from "./FE4U-Lab2-mock.js";

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

export function mergeRandomAndAdditionalUsers(randomUsers: RandomUser[], additionalUsers: AdditionalUser[]): Teacher[] {
    const fromRandom = randomUsers.map(r => mapRandomUserToTeacher(r));
    const fromAdditional = additionalUsers.map(a => mapAdditionalUserToTeacher(a));
    const teachers = new Map<string, Teacher>();
    for (const r of fromRandom) {
        teachers.set(r.full_name, r);
    }
    for (const a of fromAdditional) {
        const r = teachers.get(a.full_name);
        teachers.set(a.full_name, r !== undefined ? { ...r, ...a } : a);
    }
    return [...teachers.values()];
}

function mapRandomUserToTeacher(user: RandomUser): Teacher {
    const { name, location, id, dob, picture } = user;
    return {
        id: id.value !== null ? `${id.name}${id.value}` : crypto.randomUUID(),
        gender: user.gender,
        title: name.title,
        full_name: `${name.first} ${name.last}`,
        city: location.city,
        state: location.state,
        country: location.country,
        postcode: location.postcode,
        coordinates: location.coordinates,
        timezone: location.timezone,
        email: user.email,
        b_date: dob.date,
        age: dob.age,
        phone: user.phone,
        picture_large: picture.large,
        picture_thumbnail: picture.thumbnail,
        favorite: false,
        course: getRandomCourse(),
        bg_color: getRandomHexColor(),
        note: null,
    };
}

function getRandomCourse(): Course {
    return COURSES[Math.floor(Math.random() * COURSES.length)]!;
}

export function getRandomHexColor(): string {
    return `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0")}`;
}

function mapAdditionalUserToTeacher(user: AdditionalUser): Teacher {
    const { b_day, ...rest } = user;
    return {
        ...rest,
        ...(b_day !== undefined && { b_date: b_day, age: calculateAge(b_day) }),
        bg_color: user.bg_color !== null ? user.bg_color : getRandomHexColor(),
        favorite: user.favorite ?? false,
        course: mapStrToCourse(user.course),
    };
}

function mapStrToCourse(course: string | null): Course {
    const match = COURSES.find(c => c.toLowerCase() === course?.trim().toLowerCase());
    return match ?? getRandomCourse();
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
