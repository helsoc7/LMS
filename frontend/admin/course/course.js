document.addEventListener('DOMContentLoaded', function() {
    const courseId = new URLSearchParams(window.location.search).get('courseId');
    if (!courseId) {
        alert('Keine Kurs-ID angegeben!');
        return;
    }

    // Funktionen zum Anzeigen der Inhalte
    function showVideos() {
        document.getElementById('courseVideos').style.display = 'block';
        document.getElementById('courseAssignments').style.display = 'none';
    }

    function showAssignments() {
        document.getElementById('courseVideos').style.display = 'none';
        document.getElementById('courseAssignments').style.display = 'block';
    }

    // Event Listener für Buttons
    document.getElementById('addVideosButton').addEventListener('click', showVideos);
    document.getElementById('showAssignmentsButton').addEventListener('click', showAssignments);

    // Laden der Kursdetails und Inhalte
    loadCourseDetails(courseId);
    loadCourseVideos(courseId);
    loadCourseAssignments(courseId);
    // Event Listener für das Hinzufügen von Videos
    document.getElementById('addVideoForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = document.getElementById('videoTitle').value;
        const url = document.getElementById('videoUrl').value;
        const description = document.getElementById('videoDescription').value;
        const courseId = new URLSearchParams(window.location.search).get('courseId');

        try {
            const response = await fetch('http://localhost:3000/addVideo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, title, url, description })
            });

            if (response.ok) {
                const addedVideo = await response.json(); // Nehmen Sie an, dass der Server das hinzugefügte Video zurückgibt

                // Füge nur das neue Video hinzu
                const videoAccordion = document.getElementById('videoAccordion');
                const videoItem = createVideoAccordionItem(addedVideo, videoAccordion.children.length);
                videoAccordion.appendChild(videoItem);

                $('#addVideoModal').modal('hide');
            } else {
                console.error('Fehler beim Hinzufügen des Videos');
            }
        } catch (error) {
            console.error('Fehler:', error);
        }
    });

});

async function loadCourseDetails(courseId) {
    try {
        const response = await fetch(`http://localhost:3000/course/${courseId}`);
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Kursdetails');
        }
        const course = await response.json();
        document.getElementById('courseName').textContent = course.course_name;
    } catch (error) {
        console.error(error);
        alert('Fehler beim Laden der Kursdetails');
    }
}

async function loadCourseVideos(courseId) {
    try {
        const response = await fetch(`http://localhost:3000/videos/${courseId}`);
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Videos');
        }
        const videos = await response.json();

        // Füge die Videos zum Akkordeon hinzu
        const videoAccordion = document.getElementById('videoAccordion');
        videos.forEach((video, index) => {
            const videoItem = createVideoAccordionItem(video, index);
            videoAccordion.appendChild(videoItem);
        });
    } catch (error) {
        console.error(error);
        alert('Fehler beim Laden der Videos');
    }
}


async function loadCourseAssignments(courseId) {
    // Implementieren Sie hier die Logik zum Laden und Anzeigen von Aufgaben
    // Beispiel:
    // const response = await fetch(`http://localhost:3000/assignments/${courseId}`);
    // const assignments = await response.json();
    // Anzeige der Aufgaben im 'courseAssignments'-Container
}


function deleteVideo(videoId) {
    currentCourseId = new URLSearchParams(window.location.search).get('courseId');
    fetch(`http://localhost:3000/deleteVideo/${videoId}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Fehler beim Löschen des Videos');
            }
            loadCourseVideos(currentCourseId); // Lade die Video-Liste neu
        })
        .catch(error => console.error('Fehler:', error));
}

function editVideo(video) {
    // Fülle das Modal-Formular mit den aktuellen Videodaten
    document.getElementById('videoTitle').value = video.title;
    document.getElementById('videoUrl').value = video.url;
    document.getElementById('videoDescription').value = video.description;

    // Zeige das Modal an
    $('#addVideoModal').modal('show');
}


function createVideoAccordionItem(video, index) {
    const item = document.createElement('div');
    item.className = 'card';

    const header = document.createElement('div');
    header.className = 'card-header';
    header.id = `heading${index}`;

    const h2 = document.createElement('h2');
    h2.className = 'mb-0';

    const button = document.createElement('button');
    button.className = 'btn btn-link btn-block text-left';
    button.type = 'button';
    button.setAttribute('data-toggle', 'collapse');
    button.setAttribute('data-target', `#collapse${index}`);
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-controls', `collapse${index}`);
    button.textContent = video.title;

    h2.appendChild(button);
    header.appendChild(h2);
    item.appendChild(header);

    const collapse = document.createElement('div');
    collapse.id = `collapse${index}`;
    collapse.className = 'collapse';
    collapse.setAttribute('aria-labelledby', `heading${index}`);
    collapse.setAttribute('data-parent', '#videoAccordion');

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const img = document.createElement('img');
    const youtubeVideoId = extractYouTubeId(video.url);
    img.src = `https://img.youtube.com/vi/${youtubeVideoId}/default.jpg`;
    img.alt = 'Vorschaubild';
    img.className = 'img-fluid';
    cardBody.appendChild(img);

    const description = document.createElement('p');
    description.textContent = video.description;
    cardBody.appendChild(description);

    // Bearbeiten-Button
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-primary';
    editButton.textContent = 'Bearbeiten';
    editButton.addEventListener('click', function() {
        // Hier die Logik zum Bearbeiten des Videos
        console.log('Bearbeiten:', video);
    });
    cardBody.appendChild(editButton);

    // Löschen-Button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger';
    deleteButton.textContent = 'Löschen';
    deleteButton.addEventListener('click', function() {
        // Hier die Logik zum Löschen des Videos
        console.log('Löschen:', video);
    });
    cardBody.appendChild(deleteButton);

    collapse.appendChild(cardBody);
    item.appendChild(collapse);

    editButton.addEventListener('click', function() {
        editVideo(video);
    });

    

    return item;
}

function extractYouTubeId(url) {
    // Extrahier die YouTube-Video-ID aus der URL
    // Beispiel: https://www.youtube.com/watch?v=dQw4w9WgXcQ
    const match = url.match(/(?:youtube\.com.*(?:\\?|&amp;)v=|youtu\.be\/)([^&amp;?\/]+)/);
    return match ? match[1] : null;
}



