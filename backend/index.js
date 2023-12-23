const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// CORS (Cross Origin Ressource Sharing) aktivieren
const cors = require('cors');

// CORS Options definieren
var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

let users = [];
let courses = [];
let assignedCourses = [];



app.use(express.json(), cors(corsOptions)); 

app.get('/', (req, res) => {
    console.log("Das ist die Startseite!");
    res.status(200).send("Willkommen auf der Startseite!");
});

// Kurse abrufen
app.get('/getCourses', (req, res) => {
    res.status(200).send(courses);
});

// Studenten abrufen
app.get('/getStudents', (req, res) => {
    // Filtert nur Studenten aus der users-Liste
    const students = users.filter(user => user.type === '1');
    res.status(200).send(students);
});


app.post('/register', (req, res) => {
    const { userName, password, type } = req.body;
    // Überprüfen, ob der Benutzer bereits existiert
    if (users.find(user => user.userName === userName)) {
        return res.status(409).send({ message: 'Benutzer existiert bereits' });
    }
    // Neuen Benutzer erstellen
    let newUser = {
        id: users.length + 1,
        userName,
        password, // Achtung: Passwörter sollten niemals im Klartext gespeichert werden!
        type
    };

    users.push(newUser);
    console.log('Benutzer registriert:', newUser);
    res.status(200).send({ message: 'Benutzer registriert', user: newUser });
});

app.post('/login', (req, res) => {
    const { userName, password, type } = req.body;

    // Benutzer suchen, der mit den Anmeldeinformationen übereinstimmt
    let user = users.find(user => user.userName === userName && user.password === password && user.type === type);

    if (user) {
        console.log('Erfolgreich angemeldet:', user);
        res.status(200).send({ message: 'Erfolgreich angemeldet', user });
    } else {
        res.status(401).send({ message: 'Anmeldung fehlgeschlagen' });
    }
});

app.post('/addCourse', (req, res) => {
    const { courseName, courseType, courseImage, courseDescription } = req.body;

    // Grundlegende Validierungen
    if (!courseName || typeof courseName !== 'string' || courseName.trim() === '') {
        return res.status(400).send({ message: 'Ungültiger Kursname' });
    }

    if (!courseType || typeof courseType !== 'string' || courseType.trim() === '') {
        return res.status(400).send({ message: 'Ungültiger Kurstyp' });
    }

    if (!courseImage || typeof courseImage !== 'string' || courseImage.trim() === '') {
        return res.status(400).send({ message: 'Ungültiges Kursbild' });
    }

    if (!courseDescription || typeof courseDescription !== 'string' || courseDescription.trim() === '') {
        return res.status(400).send({ message: 'Ungültige Kursbeschreibung' });
    }

    // Überprüfen, ob der Kurs bereits existiert
    const courseExists = courses.some(course => course.courseName.toLowerCase() === courseName.toLowerCase());
    if (courseExists) {
        return res.status(409).send({ message: 'Kurs existiert bereits' });
    }

    // Neuen Kurs erstellen
    let newCourse = {
        id: courses.length + 1,
        courseName,
        courseType,
        courseImage,
        courseDescription
    };

    courses.push(newCourse);
    console.log('Kurs hinzugefügt:', newCourse);
    res.status(200).send({ message: 'Kurs erfolgreich hinzugefügt', course: newCourse });
});


// Kurs einem Studenten zuweisen
app.post('/assignCourse', (req, res) => {
    const { studentId, courseId } = req.body;

    // Finde den entsprechenden Studenten und Kurs
    const student = users.find(user => user.id === studentId && user.type === '1');
    const course = courses.find(course => course.id === courseId);

    if (!student || !course) {
        return res.status(404).send({ message: 'Student oder Kurs nicht gefunden' });
    }

    // Zuweisung speichern
    assignedCourses.push({ studentId, courseId });
    console.log(`Kurs ${courseId} wurde Student ${studentId} zugewiesen`);
    res.status(200).send({ message: 'Kurs erfolgreich zugewiesen' });
});


// Zugewiesene Kurse für einen bestimmten Studenten abrufen
app.get('/getAssignedCourses/:studentId', (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const assignedCoursesForStudent = assignedCourses
        .filter(ac => ac.studentId === studentId)
        .map(ac => {
            const course = courses.find(course => course.id === ac.courseId);
            return course || {};
        });

    res.status(200).send(assignedCoursesForStudent);
});


app.listen(port, () => {
    console.log('Server läuft auf http://localhost:${port}');
});
