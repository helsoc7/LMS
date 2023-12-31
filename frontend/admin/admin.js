console.log("Skript für Admin-Startseite läuft");

const apiUrl = "http://localhost:3000/";

"use strict";

const admin = 0;
const student = 1;

async function checkLogin() {
    let loginUser = JSON.parse(sessionStorage.getItem("loginUser"));
    if (loginUser) {
        if (loginUser.type != admin) {
            location.href = "../index.html";
        } else {
            document.getElementById("loginUserName").innerText = "Welcome, " + loginUser.userName;
            await getStudents();
            await displayCourses();
        }
    } else {
        location.href = "../index.html";
    }
}

function logout() {
    sessionStorage.removeItem("loginUser");
    location.reload();
}

async function getStudents() {
    try {
        const response = await fetch('http://localhost:3000/getStudents');
        const students = await response.json();
        console.log(students);
        let studentHTML = '';
        students.forEach((student) => {
            studentHTML += `
            <div id="accordion${student.user_id}">
            <div class="card">
                <div class="card-header text-start" data-bs-toggle="collapse" href="#collapse${student.user_id}">
                    ${student.username}
                </div>
                <div id="collapse${student.user_id}" class="collapse" data-bs-parent="#accordion${student.user_id}">
                    <div class="card-body">
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Kursname</th>
                                    <th>Zugehörigkeit</th>
                                    <th>Aktion</th>
                                </tr>
                            </thead>
                            <tbody id="table-${student.user_id}">
                                <!-- Kurszeilen werden hier eingefügt -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
            `;
            populateAssignedCourses(student.user_id);
        });

        document.getElementById("students").innerHTML = studentHTML;
        students.forEach((student) => {
            populateCourses(student.user_id);
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Studenten:', error);
    }
}

async function populateCourses(studentId) {
    try {
        const response = await fetch('http://localhost:3000/getCourses');
        const courses = await response.json();

        let courseHTML = '';
        courses.forEach((course) => {
            courseHTML += `
                <tr>
                    <td class="w-80">${course.course_name}</td>
                    <td id="assignedCourse-${studentId}-${course.course_id}">...</td>
                    <td>
                        <button type="button" onclick="addCourse('${studentId}', '${course.course_id}');" class="btn btn-primary btn-sm">Add</button>
                        <button type="button" onclick="removeCourse('${studentId}', '${course.course_id}');" class="btn btn-danger btn-sm">Remove</button>
                    </td>
                </tr>
            `;
        });

        document.getElementById(`table-${studentId}`).innerHTML = courseHTML;
        populateAssignedCourses(studentId);
    } catch (error) {
        console.error('Fehler beim Abrufen der Kurse:', error);
    }
}

async function displayCourses() {
    try {
        const response = await fetch('http://localhost:3000/getCourses');
        const courses = await response.json();
        let displayCoursesHTML = '';
        courses.forEach((course) => {
            displayCoursesHTML += `
                <div class="col-4">
                    <div class="card">
                        <img src="${course.course_image}" class="card-img-top" alt="image" />
                        <hr>
                        <div class="card-body">
                            <h5 class="card-title">${course.course_name}</h5>
                            <span>(${course.course_type})</span>
                            <p class="card-text">${course.course_description}</p>
                            <button onclick="deleteCourse('${course.course_id}')" class="btn btn-danger">Löschen</button>
                        </div>
                    </div>
                </div>
            `;
        });

        document.getElementById("displayCourses").innerHTML = displayCoursesHTML;
    } catch (error) {
        console.error('Fehler beim Anzeigen der Kurse:', error);
    }
}

async function addCourse(user_id, course_id) {
    try {
        const response = await fetch('http://localhost:3000/assignCourse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, course_id })
        });

        if (response.ok) {
            await getStudents();
        } else {
            console.error('Fehler beim Zuweisen des Kurses');
        }
    } catch (error) {
        console.error('Fehler:', error);
    }
}

async function deleteCourse(course_id) {
    try {
        const response = await fetch(apiUrl + 'deleteCourse/' + course_id, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log('Kurs gelöscht');
            await displayCourses(); // Aktualisieren der Kursliste
        } else {
            console.error('Fehler beim Löschen des Kurses');
        }
    } catch (error) {
        console.error('Fehler:', error);
    }
}


// Funktion zum Abrufen und Anzeigen zugeordneter Kurse
async function populateAssignedCourses(studentId) {
    try {
        const response = await fetch(`http://localhost:3000/getAssignedCourses/${studentId}`);
        const assignedCourses = await response.json();

        assignedCourses.forEach(assignedCourse => {
            const assignedCourseCell = document.getElementById(`assignedCourse-${studentId}-${assignedCourse.course_id}`);
            if (assignedCourseCell) {
                assignedCourseCell.innerHTML = "Ist zugewiesen";
            }
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der zugewiesenen Kurse:', error);
    }
}


// Funktion zum Entfernen eines zugewiesenen Kurses
async function removeCourse(studentId, courseId) {
    try {
        const response = await fetch(apiUrl + 'unassignCourse', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, courseId })
        });

        if (response.ok) {
            console.log('Kurs entfernt');
            await getStudents(); // Die Liste der Studenten aktualisieren, um die Änderungen zu reflektieren
        } else {
            console.error('Fehler beim Entfernen des Kurses');
        }
    } catch (error) {
        console.error('Fehler:', error);
    }
}

document.getElementById("btnCourse").addEventListener("click", async (event) => {
    let course_name = document.forms.course.course_name.value;
    let course_type = document.forms.course.course_type.value;
    let course_description = document.forms.course.course_description.value;
    let course_image = document.forms.course.course_image.value;

    if (!document.forms.course.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        document.forms.course.classList.add("was-validated");
    } else {
        try {
            const response = await fetch('http://localhost:3000/addCourse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_name, course_type, course_description, course_image })
            });

            if (response.ok) {
                document.getElementById("courseAlert").classList.remove("d-none");
                await displayCourses();
            } else {
                console.error('Fehler beim Hinzufügen des Kurses. Status:', response.status);
                const resText = await response.text();
                console.error('Serverantwort:', resText);
                document.getElementById("courseExitAlert").classList.remove("d-none");
            }
        } catch (error) {
            console.error('Fehler:', error);
        }

        document.forms.course.reset();

        setTimeout(() => {
            document.getElementById("courseAlert").classList.add("d-none");
            document.getElementById("courseExitAlert").classList.add("d-none");
        }, 2000);
    }
}); 
