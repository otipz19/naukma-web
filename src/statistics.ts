import Chart from "chart.js/auto";
import type WebDataRocks from "@webdatarocks/webdatarocks";
import dayjs from "dayjs";
import { capitalize, countBy, find, inRange, keys, map, orderBy, times, toPairs } from "lodash-es";
import { Teacher } from "./teacher.js";

declare global {
    interface Window {
        WebDataRocks: typeof WebDataRocks;
    }
}

export type StatisticsGroup = "course" | "age" | "gender" | "country";
export type ReportKind = "countries" | "flat";

const UNKNOWN = "Unknown";

const AGE_GROUPS = [
    { label: "18-31", min: 18, max: 31 },
    { label: "32-42", min: 32, max: 42 },
    { label: "43-67", min: 43, max: 67 },
    { label: "68+", min: 68, max: 150 },
];

const GROUPERS: Record<StatisticsGroup, (t: Teacher) => string> = {
    course: t => t.course,
    gender: t => capitalize(t.gender),
    country: t => t.country ?? UNKNOWN,
    age: t => find(AGE_GROUPS, g => t.age != undefined && inRange(t.age, g.min, g.max + 1))?.label ?? UNKNOWN,
};

const PALETTE = [
    "#f75c49", "#62a6c6", "#f4b942", "#6bbf59", "#a56cc1", "#ff8fab",
    "#4c6ef5", "#20c997", "#fd7e14", "#868e96", "#c2255c", "#2b8a3e",
];

const REPORT_FIELDS = {
    full_name: { type: "string", caption: "Name" },
    course: { type: "string", caption: "Specialty" },
    gender: { type: "string", caption: "Gender" },
    age: { type: "number", caption: "Age" },
    b_date: { type: "date string", caption: "Birthday" },
    country: { type: "string", caption: "Country" },
    city: { type: "string", caption: "City" },
    email: { type: "string", caption: "Email" },
    phone: { type: "string", caption: "Phone" },
    favorite: { type: "string", caption: "Favorite" },
};

let chart: Chart<"pie", number[], string> | null = null;
let pivot: WebDataRocks.Pivot | null = null;

export function renderPieChart(canvas: HTMLCanvasElement, teachers: Teacher[], group: StatisticsGroup): void {
    const counts = orderBy(toPairs(countBy(teachers, GROUPERS[group])), ([, count]) => count, "desc");
    const labels = map(counts, ([label]) => label);
    const data = map(counts, ([, count]) => count);
    const backgroundColor = times(counts.length, i => PALETTE[i % PALETTE.length]!);

    if (chart === null) {
        chart = new Chart(canvas, {
            type: "pie",
            data: { labels, datasets: [{ data, backgroundColor }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "right" } },
            },
        });
        return;
    }
    chart.data.labels = labels;
    chart.data.datasets[0] = { data, backgroundColor };
    chart.update();
}

function toReportData(teachers: Teacher[]): object[] {
    return [
        REPORT_FIELDS,
        ...map(teachers, t => ({
            full_name: t.full_name,
            course: t.course,
            gender: capitalize(t.gender),
            age: t.age,
            b_date: t.b_date != undefined ? dayjs(t.b_date).format("YYYY-MM-DD") : undefined,
            country: t.country,
            city: t.city,
            email: t.email,
            phone: t.phone,
            favorite: t.favorite ? "Yes" : "No",
        })),
    ];
}

function countriesReport(data: object[]): WebDataRocks.Report {
    return {
        dataSource: { data },
        slice: {
            rows: [{ uniqueName: "country" }],
            columns: [{ uniqueName: "gender" }, { uniqueName: "Measures" }],
            measures: [
                { uniqueName: "full_name", aggregation: "count", caption: "Teachers" },
                { uniqueName: "age", aggregation: "average", caption: "Average age", format: "age" },
            ],
        },
        formats: [{ name: "age", decimalPlaces: 1 }],
        options: { showAggregationLabels: false, grid: { title: "Teachers by country", showHeaders: false } },
    };
}

function flatReport(data: object[]): WebDataRocks.Report {
    return {
        dataSource: { data },
        slice: {
            rows: map(keys(REPORT_FIELDS), uniqueName => ({ uniqueName })),
            measures: [],
        },
        options: {
            datePattern: "dd.MM.yyyy",
            grid: { type: "flat", title: "All teachers", showTotals: "off", showGrandTotals: "off", showHeaders: false },
        },
    };
}

export function renderReport(container: HTMLDivElement, teachers: Teacher[], kind: ReportKind): void {
    const data = toReportData(teachers);
    const report = kind === "countries" ? countriesReport(data) : flatReport(data);
    if (pivot === null) {
        pivot = new window.WebDataRocks({ container, toolbar: false, width: "100%", height: 480, report });
        return;
    }
    pivot.setReport(report);
}
