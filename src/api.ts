import { Gender, Coordinates, Timezone, Teacher, getRandomCourse, getRandomHexColor } from "./teacher.js";

const RANDOM_USER_API = "https://randomuser.me/api/";
// Started with `npm run server`
const JSON_SERVER_API = "http://localhost:3000/teachers";

// Only the fields of https://randomuser.me/api response that are used by the app
interface RandomUser {
    gender: Gender;
    name: { title: string; first: string; last: string };
    location: {
        city: string;
        state: string;
        country: string;
        postcode: number | string;
        coordinates: Coordinates;
        timezone: Timezone;
    };
    email: string;
    login: { uuid: string };
    dob: { date: string; age: number };
    phone: string;
    picture: { large: string; medium: string; thumbnail: string };
}

interface RandomUserResponse {
    results: RandomUser[];
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
        throw new Error(`Request to ${url} failed: ${response.status} ${response.statusText}`);
    }
    return await response.json() as T;
}

export async function fetchRandomTeachers(count: number): Promise<Teacher[]> {
    const { results } = await fetchJson<RandomUserResponse>(`${RANDOM_USER_API}?results=${count}`);
    return results.map(mapRandomUserToTeacher);
}

function mapRandomUserToTeacher(user: RandomUser): Teacher {
    const { name, location, login, dob, picture } = user;
    return {
        id: login.uuid,
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

export async function fetchSavedTeachers(): Promise<Teacher[]> {
    return await fetchJson<Teacher[]>(JSON_SERVER_API);
}

export async function saveTeacher(teacher: Teacher): Promise<Teacher> {
    return await fetchJson<Teacher>(JSON_SERVER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacher),
    });
}
