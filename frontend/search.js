document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('query');

    if (searchQuery) {
        // Führen Sie hier die Suche durch und zeigen Sie die Ergebnisse an
        // Zum Beispiel mit fetch('http://localhost:3000/searchCourses?query=' + searchQuery)
    } else {
        // Kein Suchbegriff vorhanden, zeigen Sie eine entsprechende Nachricht an
        document.getElementById('searchResultsContainer').textContent = 'Kein Suchbegriff angegeben.';
    }
});


