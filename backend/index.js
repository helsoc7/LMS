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

app.use(express.static('frontend'));

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
    const { course_name, course_type, course_image, course_description } = req.body;

    // Grundlegende Validierungen
    if (!course_name || typeof course_name !== 'string' || course_name.trim() === '') {
        return res.status(400).send({ message: 'Ungültiger Kursname' });
    }

    if (!course_type || typeof course_type !== 'string' || course_type.trim() === '') {
        return res.status(400).send({ message: 'Ungültiger Kurstyp' });
    }

    if (!course_image || typeof course_image !== 'string' || course_image.trim() === '') {
        return res.status(400).send({ message: 'Ungültiges Kursbild' });
    }

    if (!course_description || typeof course_description !== 'string' || course_description.trim() === '') {
        return res.status(400).send({ message: 'Ungültige Kursbeschreibung' });
    }

    try {
        const cnx = await getConnection();
        const [existing] = await cnx.query('SELECT * FROM course WHERE course_name = ?', [course_name]);
        if (existing.length > 0) {
            return res.status(409).send({ message: 'Kurs existiert bereits' });
        }

        await cnx.execute('INSERT INTO course (course_name, course_type, course_image, course_description) VALUES (?, ?, ?, ?)', [course_name, course_type, course_image, course_description]);
        console.log('Kurs hinzugefügt:', { course_name, course_type });
        res.status(200).send({ message: 'Kurs erfolgreich hinzugefügt', course: { course_name, course_type } });

        await cnx.end();
    } catch (error) {
        console.error("Error adding course", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


// Kurs einem Studenten zuweisen
app.post('/assignCourse', async (req, res) => {
    const { user_id, course_id } = req.body;

    try {
        const cnx = await getConnection();

        // Überprüfen, ob der Student existiert
        const [studentExists] = await cnx.query('SELECT * FROM users WHERE user_id = ? AND type = 1', [user_id]);
        if (studentExists.length === 0) {
            return res.status(404).send({ message: 'Student nicht gefunden' });
        }

        // Überprüfen, ob der Kurs existiert
        const [courseExists] = await cnx.query('SELECT * FROM course WHERE course_id = ?', [course_id]);
        if (courseExists.length === 0) {
            return res.status(404).send({ message: 'Kurs nicht gefunden' });
        }

        // Zuweisung speichern
        await cnx.execute('INSERT INTO assigned_courses (student_id, course_id) VALUES (?, ?)', [user_id, course_id]);
        console.log(`Kurs ${course_id} wurde Student ${user_id} zugewiesen`);
        res.status(200).send({ message: 'Kurs erfolgreich zugewiesen' });

        await cnx.end();
    } catch (error) {
        console.error("Error assigning course", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


// Zugewiesene Kurse für einen bestimmten Studenten abrufen
app.get('/getAssignedCourses/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const cnx = await getConnection();
        const [assignedCourses] = await cnx.query(`
            SELECT course.* FROM assigned_courses 
            JOIN course ON assigned_courses.course_id = course.course_id 
            WHERE assigned_courses.student_id = ?`, [studentId]);

        res.status(200).send(assignedCourses);
        await cnx.end();
    } catch (error) {
        console.error("Error retrieving assigned courses for student", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


// Kurse löschen
app.delete('/deleteCourse/:courseId', async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const cnx = await getConnection();
        await cnx.execute('DELETE FROM course WHERE course_id = ?', [courseId]);
        res.status(200).send({ message: 'Kurs erfolgreich gelöscht' });
        await cnx.end();
    } catch (error) {
        console.error("Error deleting course", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

// Route zum Entfernen eines zugewiesenen Kurses
app.delete('/unassignCourse', async (req, res) => {
    const { studentId, courseId } = req.body;
    try {
        const cnx = await getConnection();
        await cnx.execute('DELETE FROM assigned_courses WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
        res.status(200).send({ message: 'Kurs erfolgreich entfernt' });
        await cnx.end();
    } catch (error) {
        console.error("Error unassigning course", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

// Route für die Kursdetails
app.get('/course/:courseId', async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const cnx = await getConnection();
        const [course] = await cnx.query('SELECT * FROM course WHERE course_id = ?', [courseId]);

        if (course.length > 0) {
            res.status(200).send(course[0]);
        } else {
            res.status(404).send({ message: 'Kurs nicht gefunden' });
        }
        await cnx.end();
    } catch (error) {
        console.error("Error retrieving course details", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

// Videos für einen spezifischen Kurs abrufen
app.get('/videos/:course_id', async (req, res) => {
    try {
        const course_id = req.params.course_id;
        const cnx = await getConnection();
        const [videos] = await cnx.query('SELECT * FROM videos WHERE course_id = ?', [course_id]);

        if (videos.length > 0) {
            res.status(200).send(videos);
        } else {
            res.status(404).send({ message: 'Keine Videos für diesen Kurs gefunden' });
        }
        await cnx.end();
    } catch (error) {
        console.error("Error retrieving videos", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


// Videos hinzufügen
app.post('/addVideo', async (req, res) => {
    const { courseId, title, url, description } = req.body;

    try {
        const cnx = await getConnection();

        // Fügen Sie das neue Video in die Datenbank ein
        await cnx.execute('INSERT INTO videos (course_id, title, url, description) VALUES (?, ?, ?, ?)', [courseId, title, url, description]);

        console.log('Video hinzugefügt:', { title });
        res.status(200).send({ message: 'Video erfolgreich hinzugefügt' });

        await cnx.end();
    } catch (error) {
        console.error("Error adding video", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


// Video wieder löschen
app.delete('/deleteVideo/:videoId', async (req, res) => {
    try {
        const videoId = req.params.videoId;
        const cnx = await getConnection();
        await cnx.execute('DELETE FROM videos WHERE video_id = ?', [videoId]);
        res.status(200).send({ message: 'Video erfolgreich gelöscht' });
        await cnx.end();
    } catch (error) {
        console.error("Error deleting video", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


// Anfragen für die Kurssuche
app.get('/searchCourses', async (req, res) => {
    const searchQuery = req.query.query;

    if (!searchQuery) {
        return res.status(400).send({ message: "Kein Suchbegriff angegeben" });
    }

    try {
        const cnx = await getConnection();
        const [results] = await cnx.query('SELECT * FROM course WHERE course_name LIKE ?', [`%${searchQuery}%`]);
        await cnx.end();

        if (results.length > 0) {
            res.status(200).send(results);
        } else {
            res.status(404).send({ message: 'Keine Kurse gefunden' });
        }
    } catch (error) {
        console.error('Fehler bei der Kurs-Suche:', error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});


app.listen(port, () => {
    console.log('Server läuft auf http://localhost:${port}');
});
