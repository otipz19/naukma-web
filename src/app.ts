import dayjs from "dayjs";
import { capitalize, compact, differenceBy, filter, find, isNil, join, map, round, sortBy, toUpper, trim, uniq, uniqBy, words } from "lodash-es";
import { COURSES, Course, Gender, Teacher, calculateAge, daysUntilNextBirthday, getRandomHexColor } from "./teacher.js";
import { isEmail, isFirstCharCapitalLetter, isFullName, isPastDate, isPhoneNumber } from "./validation.js";
import { filterTeachers, sortTeachers, searchTeachers, TeacherFilter, TeacherSortProp } from "./teacher-query.js";
import { fetchRandomTeachers, fetchSavedTeachers, saveTeacher } from "./api.js";
import { showTeacherLocation } from "./teacher-map.js";
import { renderPieChart, renderReport, ReportKind, StatisticsGroup } from "./statistics.js";

const INITIAL_COUNT = 50;
const LOAD_MORE_COUNT = 10;
const DEFAULT_COUNTRIES = ["Ukraine", "USA", "UK", "Germany", "France"];

const teachers: Teacher[] = [];

const state = {
    filter: {} as TeacherFilter,
    search: "",
    sort: { prop: "full_name" as TeacherSortProp, isDesc: false },
    statisticsView: "chart" as "chart" | ReportKind,
    statisticsGroup: "course" as StatisticsGroup,
    selectedId: null as string | null,
    mapVisible: false,
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
    return toUpper(join(map(words(fullName, /\S+/g), p => p.charAt(0)), "."));
}

function getAllCountries(): string[] {
    return sortBy(uniq([...DEFAULT_COUNTRIES, ...compact(map(teachers, "country"))]));
}

function getVisibleTeachers(): Teacher[] {
    return searchTeachers(filterTeachers(teachers, state.filter), state.search);
}

function findTeacher(id: string | null): Teacher | undefined {
    return find(teachers, { id: id ?? "" });
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
        ? sortTeachers(visible, state.sort.prop, state.sort.isDesc).map(t => teacherCardHtml(t, true)).join("")
        : `<p class="empty-message">${escapeHtml(message)}</p>`;
}

function renderStatistics(): void {
    const visible = getVisibleTeachers();
    const percent = teachers.length > 0 ? round(100 * visible.length / teachers.length, 1) : 0;
    $<HTMLParagraphElement>(".statistics-summary").textContent = state.statisticsView === "chart"
        ? `Showing ${visible.length} of ${teachers.length} teachers (${percent}%)`
        : `All ${teachers.length} loaded teachers`;

    document.querySelectorAll<HTMLButtonElement>(".statistics-view-btn").forEach(btn =>
        btn.classList.toggle("active", btn.dataset.view === state.statisticsView));
    document.querySelectorAll<HTMLElement>(".statistics-view").forEach(view =>
        view.hidden = view.dataset.view !== (state.statisticsView === "chart" ? "chart" : "report"));
    $<HTMLDivElement>(".statistics-group").hidden = state.statisticsView !== "chart";

    if (state.statisticsView === "chart") {
        renderPieChart($<HTMLCanvasElement>("#statistics-chart"), visible, state.statisticsGroup);
    } else {
        renderReport($<HTMLDivElement>("#statistics-report"), teachers, state.statisticsView);
    }

    const loadMore = $<HTMLButtonElement>(".load-more-btn");
    loadMore.disabled = state.loading;
    loadMore.textContent = state.loading ? "Loading..." : `Load ${LOAD_MORE_COUNT} more teachers`;
    $<HTMLSpanElement>(".statistics-error").textContent = state.error ?? "";
}

function renderFavorites(): void {
    const favorites = filter(teachers, "favorite");
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
    q<HTMLDivElement>(".teacher-dialog-location").textContent = join(compact([t.city, t.country]), ", ");
    q<HTMLDivElement>(".teacher-dialog-age-gender").textContent = join(compact([t.age, capitalize(t.gender)]), ", ");
    q<HTMLDivElement>(".teacher-dialog-birthday").textContent = birthdayText(t);
    const email = q<HTMLAnchorElement>(".teacher-dialog-email");
    email.textContent = t.email ?? "";
    email.href = t.email != undefined ? `mailto:${t.email}` : "";
    q<HTMLDivElement>(".teacher-dialog-phone").textContent = t.phone ?? "";
    q<HTMLParagraphElement>(".teacher-dialog-description").textContent = t.note ?? "";
    q<HTMLButtonElement>(".teacher-dialog-star-btn").classList.toggle("active", t.favorite);

}

function birthdayText(t: Teacher): string {
    if (isNil(t.b_date)) return "";
    const days = daysUntilNextBirthday(t.b_date);
    const date = dayjs(t.b_date).format("DD.MM.YYYY");
    if (days === 0) return `Birthday: ${date}, today!`;
    return `Birthday: ${date}, ${days} ${days === 1 ? "day" : "days"} until next birthday`;
}

function renderTeacherMap(t: Teacher): void {
    const toggle = $<HTMLButtonElement>(".teacher-dialog-map-toggle");
    const container = $<HTMLDivElement>(".teacher-dialog-map");
    toggle.hidden = isNil(t.coordinates);
    toggle.textContent = state.mapVisible ? "hide map" : "show map";
    container.hidden = isNil(t.coordinates) || !state.mapVisible;
    if (!container.hidden && !isNil(t.coordinates)) {
        showTeacherLocation(container, t.coordinates, join(compact([t.full_name, t.city, t.country]), ", "));
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
    const t = findTeacher(id);
    if (t === undefined) return;
    state.selectedId = id;
    renderTeacherInfo(t);
    $<HTMLDialogElement>("#teacher-info-popup").showPopover();
    renderTeacherMap(t);
}

function fillSelect(select: HTMLSelectElement, values: readonly string[], keepFirst: boolean): void {
    const first = keepFirst ? select.options[0]?.outerHTML ?? "" : "";
    select.innerHTML = first + values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
}

function addTeachers(added: Teacher[]): void {
    teachers.push(...differenceBy(uniqBy(added, "id"), teachers, "id"));
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
        const sort = String(new FormData(form).get("sort"));
        state.sort = { prop: trim(sort, "-") as TeacherSortProp, isDesc: sort.startsWith("-") };
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
        renderTopTeachers();
        renderStatistics();
        $<HTMLElement>("#top-teachers").scrollIntoView({ behavior: "smooth" });
    });
    input.addEventListener("input", () => {
        if (input.value.trim() === "") {
            state.search = "";
            renderTopTeachers();
            renderStatistics();
        }
    });
}

function setupStatistics(): void {
    $<HTMLDivElement>(".statistics-views").addEventListener("click", e => {
        const btn = (e.target as Element).closest<HTMLButtonElement>(".statistics-view-btn");
        if (btn?.dataset.view == undefined) return;
        state.statisticsView = btn.dataset.view as typeof state.statisticsView;
        renderStatistics();
    });
    $<HTMLSelectElement>("#statistics-group-select").addEventListener("change", e => {
        state.statisticsGroup = (e.target as HTMLSelectElement).value as StatisticsGroup;
        renderStatistics();
    });
    $<HTMLButtonElement>(".load-more-btn").addEventListener("click", () => void loadTeachers(LOAD_MORE_COUNT));
}

function setupTeacherInfo(): void {
    for (const container of [".top-teachers-list", ".favorites-cards"]) {
        $<HTMLDivElement>(container).addEventListener("click", e => {
            const btn = (e.target as Element).closest<HTMLButtonElement>(".teacher-photo-container");
            if (btn?.dataset.id != undefined) openTeacherInfo(btn.dataset.id);
        });
    }
    $<HTMLButtonElement>(".teacher-dialog-star-btn").addEventListener("click", () => {
        const t = findTeacher(state.selectedId);
        if (t === undefined) return;
        t.favorite = !t.favorite;
        renderTeacherInfo(t);
        renderTopTeachers();
        renderStatistics();
        renderFavorites();
    });
    $<HTMLButtonElement>(".teacher-dialog-map-toggle").addEventListener("click", () => {
        const t = findTeacher(state.selectedId);
        if (t === undefined) return;
        state.mapVisible = !state.mapVisible;
        renderTeacherMap(t);
    });
}

function setupFavoritesCarousel(): void {
    const cards = $<HTMLDivElement>(".favorites-cards");
    const step = () => cards.clientWidth / 2;
    $<HTMLButtonElement>("#favorites .nav-arrow.prev").addEventListener("click", () => cards.scrollBy({ left: -step(), behavior: "smooth" }));
    $<HTMLButtonElement>("#favorites .nav-arrow.next").addEventListener("click", () => cards.scrollBy({ left: step(), behavior: "smooth" }));
}

function validateNewTeacher(data: FormData): string | null {
    if (!isFullName(String(data.get("name") ?? ""))) {
        return "Name must contain first and last name, each starting with a capital letter";
    }
    const city = trim(String(data.get("city") ?? ""));
    if (city !== "" && !isFirstCharCapitalLetter(city)) {
        return "City must start with a capital letter";
    }
    if (!isEmail(String(data.get("email") ?? ""))) {
        return "Invalid email";
    }
    if (!isPhoneNumber(String(data.get("phone") ?? ""))) {
        return "Phone must be in international format, e.g. +380961234567";
    }
    if (!isPastDate(String(data.get("dob") ?? ""))) {
        return "Date of birth must be in the past";
    }
    if (data.get("sex") == null) {
        return "Select sex";
    }
    return null;
}

function createTeacherFromForm(data: FormData): Teacher {
    const dob = dayjs(String(data.get("dob"))).toISOString();
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
