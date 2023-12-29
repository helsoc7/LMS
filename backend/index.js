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

// MySQL hinzufügen
const mysql = require('mysql2/promise');

// dotenv hinzufügen
const { config } = require('dotenv');

// Check if the .env file exists
if (config().parsed == undefined) {
    console.error('Error: .env file is missing (copy/adapt .env.example and rename it to .env)');
    process.exit(1); // Exit the process with an error code
}


// Debug-Ausgabe für Umgebung
if (process.env.ENABLE_DEBUG == "TRUE") {
    console.log("env:", process.env);
}

async function getConnection() {
    try {
        return await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
    } catch (error) {
        console.error("Database connection error", error);
        throw error; // Weitergabe des Fehlers
    }
}


app.use(express.json(), cors(corsOptions)); 

app.get('/', (req, res) => {
    console.log("Das ist die Startseite!");
    res.status(200).send("Willkommen auf der Startseite!");
});

// Kurse abrufen
app.get('/getCourses', async (req, res) => {
    try {
        const cnx = await getConnection();
        const [results] = await cnx.query('SELECT * FROM course;');
        res.status(200).send(results);
        await cnx.end();
    } catch (error) {
        console.error("Could not retrieve course list", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

// Studenten abrufen
app.get('/getStudents', async (req, res) => {
    try {
        const cnx = await getConnection();
        const [students] = await cnx.query('SELECT * FROM users WHERE type = 1');
        res.status(200).send(students);
        await cnx.end();
    } catch (error) {
        console.error("Could not retrieve students", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

// Benutzer registrieren
app.post('/register', async (req, res) => {
    const { userName, password, type } = req.body;

    try {
        const cnx = await getConnection();
        // Überprüfen, ob der Benutzer bereits existiert
        const [users] = await cnx.query('SELECT * FROM users WHERE username = ?', [userName]);
        if (users.length > 0) {
            return res.status(409).send({ message: 'Benutzer existiert bereits' });
        }

        // Neuen Benutzer erstellen
        await cnx.execute('INSERT INTO users (username, password, type) VALUES (?, ?, ?)', [userName, password, type]);
        console.log('Benutzer registriert:', { userName, type });
        res.status(200).send({ message: 'Benutzer registriert', user: { userName, type } });

        await cnx.end();
    } catch (error) {
        console.error("Error during registration", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

// Anmeldung eines Benutzers
app.post('/login', async (req, res) => {
    const { userName, password, type } = req.body;

    try {
        const cnx = await getConnection();
        const [users] = await cnx.query('SELECT * FROM users WHERE username = ? AND password = ? AND type = ?', [userName, password, type]);

        if (users.length > 0) {
            console.log('Erfolgreich angemeldet:', users[0]);
            res.status(200).send({ message: 'Erfolgreich angemeldet', user: users[0] });
        } else {
            res.status(401).send({ message: 'Anmeldung fehlgeschlagen' });
        }

        await cnx.end();
    } catch (error) {
        console.error("Login error", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

app.post('/addCourse', async (req, res) => {
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

    try {
        const cnx = await getConnection();
        const [existing] = await cnx.query('SELECT * FROM course WHERE course_name = ?', [courseName]);
        if (existing.length > 0) {
            return res.status(409).send({ message: 'Kurs existiert bereits' });
        }

        await cnx.execute('INSERT INTO course (course_name, course_type, course_image, course_description) VALUES (?, ?, ?, ?)', [courseName, courseType, courseImage, courseDescription]);
        console.log('Kurs hinzugefügt:', { courseName, courseType });
        res.status(200).send({ message: 'Kurs erfolgreich hinzugefügt', course: { courseName, courseType } });

        await cnx.end();
    } catch (error) {
        console.error("Error adding course", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


// Kurs einem Studenten zuweisen
app.post('/assignCourse', (req, res) => {
    const { studentId, courseId } = req.body;

    // Finde den entsprechenden Studenten und Kurs
    const student = users.find(user => user.id === studentId && user.type === 'student');
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
app.get('/getAssignedCourses/:studentId', async (req, res) => {
    const studentId = parseInt(req.params.studentId);

    try {
        const cnx = await getConnection();
        const [assignedCourses] = await cnx.query(`
            SELECT c.course_id, c.course_name, c.course_type, c.course_image, c.course_description 
            FROM assigned_courses ac 
            JOIN course c ON ac.course_id = c.course_id 
            WHERE ac.student_id = ?`, [studentId]);

        res.status(200).send({ courses: assignedCourses });
        await cnx.end();
    } catch (error) {
        console.error("Error retrieving assigned courses", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


app.listen(port, () => {
    console.log('Server läuft auf http://localhost:${port}');
});
