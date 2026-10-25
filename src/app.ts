import { COURSES, Course, Gender, Teacher, calculateAge, getRandomHexColor } from "./teacher.js";
import { isEmail, isFirstCharCapitalLetter, isPhoneNumber } from "./validation.js";
import { filterTeachers, sortTeachers, searchTeachers, TeacherFilter, TeacherSortProp } from "./teacher-query.js";
import { fetchRandomTeachers, fetchSavedTeachers, saveTeacher } from "./api.js";

const INITIAL_COUNT = 50;
const PAGE_SIZE = 10;
const DEFAULT_COUNTRIES = ["Ukraine", "USA", "UK", "Germany", "France"];

const teachers: Teacher[] = [];

const state = {
    filter: {} as TeacherFilter,
    search: "",
    sort: { prop: "full_name" as TeacherSortProp, isDesc: false },
    page: 0,
    selectedId: null as string | null,
    loading: false,
    error: null as string | null,
};

function $<T extends Element>(selector: string): T {
    const el = document.querySelector<T>(selector);
    if (el === null) {
        throw new Error(`Element not found: ${selector}`);
    }
    return el;
}

function escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
}

function getInitials(fullName: string): string {
    return fullName.split(/\s+/).map(p => p.charAt(0)).join(".").toUpperCase();
}

function getAllCountries(): string[] {
    const countries = new Set<string>(DEFAULT_COUNTRIES);
    for (const t of teachers) {
        if (t.country != undefined) countries.add(t.country);
    }
    return [...countries].sort((a, b) => a.localeCompare(b));
}

function getVisibleTeachers(): Teacher[] {
    return searchTeachers(filterTeachers(teachers, state.filter), state.search);
}

function photoHtml(t: Teacher): string {
    return t.picture_large != undefined
        ? `<img src="${escapeHtml(t.picture_large)}" alt="${escapeHtml(t.full_name)}" />`
        : `<span class="teacher-initials" style="background-color: ${escapeHtml(t.bg_color)}">${escapeHtml(getInitials(t.full_name))}</span>`;
}

function teacherCardHtml(t: Teacher, withCourse: boolean): string {
    const [first, ...rest] = t.full_name.split(" ");
    const star = t.favorite
        ? `<svg class="star-icon" viewBox="0 0 24 24" width="24" height="24" fill="yellow">
               <path stroke="black" stroke-width="0.2" stroke-linejoin="round"
                   d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
           </svg>`
        : "";
    return `
        <div class="teacher-short-info-container">
            <div class="teacher-short-info-img-container">
                ${withCourse ? star : ""}
                <button type="button" class="teacher-photo-container" data-id="${escapeHtml(t.id)}"
                    aria-label="Open ${escapeHtml(t.full_name)} details">
                    ${photoHtml(t)}
                </button>
            </div>
            <div class="teacher-name">
                <span>${escapeHtml(first ?? "")}</span>
                <span>${escapeHtml(rest.join(" "))}</span>
            </div>
            ${withCourse ? `<span class="teacher-domain">${escapeHtml(t.course)}</span>` : ""}
            <span class="teacher-country">${escapeHtml(t.country ?? "")}</span>
        </div>`;
}

function renderTopTeachers(): void {
    const visible = getVisibleTeachers();
    let message = "No teachers found";
    if (teachers.length === 0 && state.loading) message = "Loading teachers...";
    if (teachers.length === 0 && state.error !== null) message = state.error;
    $<HTMLDivElement>(".top-teachers-list").innerHTML = visible.length > 0
        ? visible.map(t => teacherCardHtml(t, true)).join("")
        : `<p class="empty-message">${escapeHtml(message)}</p>`;
}

function renderStatistics(): void {
    const visible = getVisibleTeachers();
    const percent = teachers.length > 0 ? (100 * visible.length / teachers.length).toFixed(1) : "0";
    $<HTMLParagraphElement>(".statistics-summary").textContent =
        `Showing ${visible.length} of ${teachers.length} teachers (${percent}%)`;

    const sorted = sortTeachers(visible, state.sort.prop, state.sort.isDesc);
    const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    state.page = Math.min(state.page, pageCount - 1);
    const pageItems = sorted.slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE);

    $<HTMLTableSectionElement>(".statistics-table tbody").innerHTML = pageItems.map(t => `
        <tr>
            <td>${escapeHtml(t.full_name)}</td>
            <td>${escapeHtml(t.course)}</td>
            <td>${t.age ?? ""}</td>
            <td>${t.b_date != undefined ? new Date(t.b_date).toLocaleDateString("uk-UA") : ""}</td>
            <td>${escapeHtml(t.gender)}</td>
            <td>${escapeHtml(t.country ?? "")}</td>
        </tr>`).join("");

    document.querySelectorAll<HTMLTableCellElement>(".statistics-table th[data-sort]").forEach(th => {
        const active = th.dataset.sort === state.sort.prop;
        th.classList.toggle("sorted", active);
        th.classList.toggle("desc", active && state.sort.isDesc);
    });

    const pages = Array.from({ length: pageCount }, (_, i) =>
        `<a href="#" data-page="${i}" class="${i === state.page ? "active" : ""}">${i + 1}</a>`);
    const next = `<button type="button" class="pagination-next" ${state.loading ? "disabled" : ""}>${state.loading ? "Loading..." : "Next &raquo;"}</button>`;
    const error = state.error !== null ? `<span class="pagination-error">${escapeHtml(state.error)}</span>` : "";
    $<HTMLDivElement>(".pagination").innerHTML = pages.join("") + next + error;
}

function renderFavorites(): void {
    const favorites = teachers.filter(t => t.favorite);
    $<HTMLDivElement>(".favorites-cards").innerHTML = favorites.length > 0
        ? favorites.map(t => teacherCardHtml(t, false)).join("")
        : `<p class="empty-message">No favorite teachers yet</p>`;
}

function renderTeacherInfo(t: Teacher): void {
    const popup = $<HTMLDialogElement>("#teacher-info-popup");
    const q = <T extends Element>(sel: string) => popup.querySelector<T>(sel)!;

    q<HTMLDivElement>(".teacher-dialog-photo").innerHTML = photoHtml(t);
    q<HTMLHeadingElement>(".teacher-dialog-name").textContent = t.full_name;
    q<HTMLDivElement>(".teacher-dialog-specialty").textContent = t.course;
    q<HTMLDivElement>(".teacher-dialog-location").textContent = [t.city, t.country].filter(Boolean).join(", ");
    q<HTMLDivElement>(".teacher-dialog-age-gender").textContent =
        [t.age, t.gender.charAt(0).toUpperCase() + t.gender.slice(1)].filter(v => v != undefined).join(", ");
    const email = q<HTMLAnchorElement>(".teacher-dialog-email");
    email.textContent = t.email ?? "";
    email.href = t.email != undefined ? `mailto:${t.email}` : "";
    q<HTMLDivElement>(".teacher-dialog-phone").textContent = t.phone ?? "";
    q<HTMLParagraphElement>(".teacher-dialog-description").textContent = t.note ?? "";
    q<HTMLButtonElement>(".teacher-dialog-star-btn").classList.toggle("active", t.favorite);

    const map = q<HTMLAnchorElement>(".teacher-dialog-map-link");
    map.hidden = t.coordinates == undefined;
    if (t.coordinates != undefined) {
        const { latitude, longitude } = t.coordinates;
        map.href = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=6/${latitude}/${longitude}`;
    }
}

function renderCountries(): void {
    const filterSelect = $<HTMLSelectElement>("#country-select");
    const filterValue = filterSelect.value;
    fillSelect(filterSelect, getAllCountries(), true);
    filterSelect.value = filterValue;

    const formSelect = $<HTMLSelectElement>("#new-teacher-country");
    const formValue = formSelect.value;
    fillSelect(formSelect, getAllCountries(), false);
    if (formValue !== "") formSelect.value = formValue;
}

function renderAll(): void {
    renderTopTeachers();
    renderStatistics();
    renderFavorites();
}

function openTeacherInfo(id: string): void {
    const t = teachers.find(t => t.id === id);
    if (t === undefined) return;
    state.selectedId = id;
    renderTeacherInfo(t);
    $<HTMLDialogElement>("#teacher-info-popup").showPopover();
}

function fillSelect(select: HTMLSelectElement, values: readonly string[], keepFirst: boolean): void {
    const first = keepFirst ? select.options[0]?.outerHTML ?? "" : "";
    select.innerHTML = first + values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
}

function addTeachers(added: Teacher[]): void {
    const ids = new Set(teachers.map(t => t.id));
    teachers.push(...added.filter(t => !ids.has(t.id)));
    renderCountries();
}

async function loadTeachers(count: number): Promise<void> {
    state.loading = true;
    state.error = null;
    renderAll();
    try {
        addTeachers(await fetchRandomTeachers(count));
    } catch (err) {
        console.error(err);
        state.error = "Failed to load teachers, try again";
    } finally {
        state.loading = false;
        renderAll();
    }
}

async function loadSavedTeachers(): Promise<void> {
    try {
        addTeachers(await fetchSavedTeachers());
        renderAll();
    } catch (err) {
        console.warn("json-server is not available, added teachers won't be saved", err);
    }
}

// Moves to the next page; on the last page requests next PAGE_SIZE users first
async function showNextPage(): Promise<void> {
    if ((state.page + 1) * PAGE_SIZE >= getVisibleTeachers().length) {
        await loadTeachers(PAGE_SIZE);
    }
    const pageCount = Math.ceil(getVisibleTeachers().length / PAGE_SIZE);
    state.page = Math.min(state.page + 1, Math.max(0, pageCount - 1));
    renderStatistics();
}

function readFilter(form: HTMLFormElement): TeacherFilter {
    const data = new FormData(form);
    const filter: TeacherFilter = {};
    const age = String(data.get("age"));
    if (age !== "all") {
        const [min, max] = age.split("-").map(Number);
        if (min !== undefined) filter.minAge = min;
        if (max !== undefined) filter.maxAge = max;
    }
    const country = String(data.get("country"));
    if (country !== "all") filter.country = country;
    const sex = String(data.get("sex"));
    if (sex !== "all") filter.gender = sex as Gender;
    if (data.has("only-favorites")) filter.favorite = true;
    if (data.has("only-photo")) filter.withPhoto = true;
    return filter;
}

function setupFilters(): void {
    const form = $<HTMLFormElement>(".teachers-filter-form");
    form.addEventListener("change", () => {
        state.filter = readFilter(form);
        state.page = 0;
        renderTopTeachers();
        renderStatistics();
    });
}

function setupSearch(): void {
    const form = $<HTMLFormElement>(".search-form");
    const input = $<HTMLInputElement>("#teacher-search");
    form.addEventListener("submit", e => {
        e.preventDefault();
        state.search = input.value;
        state.page = 0;
        renderTopTeachers();
        renderStatistics();
        $<HTMLElement>("#top-teachers").scrollIntoView({ behavior: "smooth" });
    });
    input.addEventListener("input", () => {
        if (input.value.trim() === "") {
            state.search = "";
            state.page = 0;
            renderTopTeachers();
            renderStatistics();
        }
    });
}

function setupStatistics(): void {
    $<HTMLTableSectionElement>(".statistics-table thead").addEventListener("click", e => {
        const th = (e.target as Element).closest<HTMLTableCellElement>("th[data-sort]");
        if (th === null) return;
        const prop = th.dataset.sort as TeacherSortProp;
        state.sort = { prop, isDesc: state.sort.prop === prop ? !state.sort.isDesc : false };
        state.page = 0;
        renderStatistics();
    });
    $<HTMLDivElement>(".pagination").addEventListener("click", e => {
        const target = e.target as Element;
        if (target.closest(".pagination-next") !== null) {
            void showNextPage();
            return;
        }
        const link = target.closest<HTMLAnchorElement>("a[data-page]");
        if (link === null) return;
        e.preventDefault();
        state.page = Number(link.dataset.page);
        renderStatistics();
    });
}

function setupTeacherInfo(): void {
    for (const container of [".top-teachers-list", ".favorites-cards"]) {
        $<HTMLDivElement>(container).addEventListener("click", e => {
            const btn = (e.target as Element).closest<HTMLButtonElement>(".teacher-photo-container");
            if (btn?.dataset.id != undefined) openTeacherInfo(btn.dataset.id);
        });
    }
    $<HTMLButtonElement>(".teacher-dialog-star-btn").addEventListener("click", () => {
        const t = teachers.find(t => t.id === state.selectedId);
        if (t === undefined) return;
        t.favorite = !t.favorite;
        renderTeacherInfo(t);
        renderTopTeachers();
        renderStatistics();
        renderFavorites();
    });
}

function setupFavoritesCarousel(): void {
    const cards = $<HTMLDivElement>(".favorites-cards");
    const step = () => cards.clientWidth / 2;
    $<HTMLButtonElement>("#favorites .nav-arrow.prev").addEventListener("click", () => cards.scrollBy({ left: -step(), behavior: "smooth" }));
    $<HTMLButtonElement>("#favorites .nav-arrow.next").addEventListener("click", () => cards.scrollBy({ left: step(), behavior: "smooth" }));
}

function validateNewTeacher(data: FormData): string | null {
    const name = String(data.get("name") ?? "").trim();
    if (name.split(/\s+/).length < 2 || !name.split(/\s+/).every(p => isFirstCharCapitalLetter(p))) {
        return "Name must contain first and last name, each starting with a capital letter";
    }
    const city = String(data.get("city") ?? "").trim();
    if (city !== "" && !isFirstCharCapitalLetter(city)) {
        return "City must start with a capital letter";
    }
    if (!isEmail(String(data.get("email") ?? ""))) {
        return "Invalid email";
    }
    if (!isPhoneNumber(String(data.get("phone") ?? ""))) {
        return "Phone must be in international format, e.g. +380961234567";
    }
    const dob = String(data.get("dob") ?? "");
    if (dob === "" || new Date(dob).getTime() >= Date.now()) {
        return "Date of birth must be in the past";
    }
    if (data.get("sex") == null) {
        return "Select sex";
    }
    return null;
}

function createTeacherFromForm(data: FormData): Teacher {
    const dob = new Date(String(data.get("dob"))).toISOString();
    const city = String(data.get("city") ?? "").trim();
    const note = String(data.get("notes") ?? "").trim();
    const gender = data.get("sex") as Gender;
    return {
        id: crypto.randomUUID(),
        gender,
        title: gender === "male" ? "Mr" : "Ms",
        full_name: String(data.get("name")).trim(),
        ...(city !== "" && { city }),
        country: String(data.get("country")),
        email: String(data.get("email")).trim(),
        phone: String(data.get("phone")).trim(),
        b_date: dob,
        age: calculateAge(dob),
        favorite: false,
        course: String(data.get("speciality")) as Course,
        bg_color: String(data.get("bg-color") ?? getRandomHexColor()),
        note: note !== "" ? note : null,
    };
}

function setupAddTeacherForm(): void {
    const form = $<HTMLFormElement>(".add-teacher-form");
    const error = $<HTMLParagraphElement>(".add-teacher-form .form-error");
    const submit = form.querySelector<HTMLButtonElement>("[type=submit]");
    fillSelect($<HTMLSelectElement>("#new-teacher-speciality"), COURSES, false);

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const data = new FormData(form);
        const message = validateNewTeacher(data);
        error.textContent = message ?? "";
        if (message !== null) return;

        if (submit !== null) submit.disabled = true;
        try {
            addTeachers([await saveTeacher(createTeacherFromForm(data))]);
        } catch (err) {
            console.error(err);
            error.textContent = "Failed to save teacher. Is json-server running (npm run server)?";
            return;
        } finally {
            if (submit !== null) submit.disabled = false;
        }
        renderAll();
        form.reset();
        $<HTMLDialogElement>("#add-teacher-popup").hidePopover();
    });
}

setupFilters();
setupSearch();
setupStatistics();
setupTeacherInfo();
setupFavoritesCarousel();
setupAddTeacherForm();
renderCountries();
void loadTeachers(INITIAL_COUNT);
void loadSavedTeachers();
