"use strict";
const apiUrl = "http://localhost:3000/";
const student = 1;
let loginUser = JSON.parse(sessionStorage.getItem("loginUser"));

function checkLogin() {
    if (loginUser) {
        if (loginUser.type != student) {
            location.href = "../index.html";
        } else {
            document.getElementById("loginUserName").innerText = "Welcome, " + loginUser.userName;
            getCourses();
        }
    } else {
        location.href = "../index.html";
    }
}

function logout() {
    sessionStorage.removeItem("loginUser");
    location.reload();
}

async function getCourses() {
    try {
        const response = await fetch(`${apiUrl}getAssignedCourses/${loginUser.id}`);
        if (response.ok) {
            const assignedCourses = await response.json();
            displayCourses(assignedCourses);
        } else {
            console.error('Fehler beim Abrufen der Kurse');
        }
    } catch (error) {
        console.error('Fehler:', error);
    }
}

function displayCourses(courses) {
    let coursesHTML = '';
    courses.forEach(course => {
        coursesHTML +=
            `<div class="col-4">
                <div class="card">
                    <img src="${course.courseImage}" class="card-img-top" alt="image" />
                    <hr>
                    <div class="card-body">
                        <h5 class="card-title">${course.courseName}</h5>
                        <span>(${course.courseType})</span>
                        <p class="card-text">${course.courseDescription}</p>
                    </div>
                </div>
            </div>`;
    });

    document.getElementById("viewCourses").innerHTML = 
        `<div class="container">
            <div class="row">${coursesHTML}</div>
        </div>`;
}
