import { RANDOM_USER_MOCK, ADDITIONAL_USERS } from "./FE4U-Lab2-mock.js";
import { mergeRandomAndAdditionalUsers } from "./task1.js";
import { validateTeacher } from "./task2.js";
import { filterTeachers } from "./task3.js";
import { sortTeachers } from "./task4.js";
import { findTeacherByQuery } from "./task5.js";
import { calcFilteredTeachersPercentage } from "./task6.js";

const teachers = mergeRandomAndAdditionalUsers(RANDOM_USER_MOCK, ADDITIONAL_USERS);
console.log("Task 1:", teachers.length, "teachers", teachers.slice(0, 2));
console.log("Task 2:", teachers.filter(validateTeacher).length, "valid");
console.log("Task 3:", filterTeachers(teachers, { country: "Germany" }).map(t => t.full_name));
console.log("Task 4:", sortTeachers(teachers, "age", true).slice(0, 3).map(t => `${t.full_name} (${t.age})`));
console.log("Task 5:", findTeacherByQuery(teachers, { name: "Olivia" })?.full_name);
console.log("Task 6:", calcFilteredTeachersPercentage(teachers, { minAge: 31 }).toFixed(1) + "%");