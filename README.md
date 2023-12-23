# Setup
Verwendet Nodejs Server
```
npm init
```
Verwendet express und cors
```
npm install express cors
```
Server starten
```
node backend/index.js
```

# Frontend
Startseite für die Registrierung ist frontend/index.html. 
Derzeit gibt es nur einen Localstorage, so dass bei jedem Neustart des Servers die Daten verloren gehen. 
Je nachdem, ob man sich als admin oder student registriert bzw. anmeldet erhält man eine andere Ansicht. Admins können außerdem Kurse hinzufügen, sich alle Students anzeigen lassen, sowie die erstellten Kurse anzeigen lassen.


## TODO
- Logout-Funktion auf den Startseiten der Rollen
