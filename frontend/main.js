console.log("Skript läuft");

const apiUrl = "http://localhost:3000/";

document.getElementById('btnRegister').addEventListener('click', async (event) => {
    event.preventDefault();
    let userName = document.forms.register.userName.value;
    let password = document.forms.register.password.value;
    let cPassword = document.forms.register.cPassword.value;
    let type = document.forms.register.registerRadioOptions.value;

    onCustomErrorCheck();

    if(!document.forms.register.checkValidity()) {
        document.forms.register.classList.add('was-validated');
    }
    else {
        try {
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName, password, type})
            });
            if(response.ok) {
                showAlert('registerAlert');
            }
            else {
                showAlert('registerExitAlert');
            }
        } catch (error) {
            console.error("Fehler beim Senden der Daten: ", error);
        }
    }
});

document.getElementById('btnLogin').addEventListener('click', async (e) => {
    e.preventDefault();
    let userName = document.forms.login.loginUserName.value;
    let password = document.forms.login.loginPassword.value;
    let type = document.forms.login.loginRadioOptions.value;

    let loginAlert = document.getElementById("loginAlert").classList;

    if (!document.forms.login.checkValidity()) {
        document.forms.login.classList.add('was-validated');
    } else {
        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName, password, type })
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Serverantwort loginUser:", data);
                const loginUser = data.user;
                sessionStorage.setItem('loginUser', JSON.stringify(loginUser));
                redirectUserBasedOnType(loginUser.type);
            } else {
                loginAlert.remove("d-none");
                setTimeout(() => loginAlert.add("d-none"), 2000);
            }
        } catch (error) {
            console.error('Fehler bei der Anmeldung:', error);
        }
    }
});

function onCustomErrorCheck() {
    let userName = document.forms.register.userName.value;
    let password = document.forms.register.password.value;
    let cPassword = document.forms.register.cPassword.value;

    if (isNaN(userName)) {
        document.forms.register.userName.setCustomValidity('');
    } else {
        document.getElementById('userNameErrorMessage').innerText = 'User Name Must be a string only.';
        document.forms.register.userName.setCustomValidity('User Name Must be a string only.');
    }

    if (cPassword === password) {
        document.forms.register.cPassword.setCustomValidity('');
    } else {
        document.getElementById('cPasswordErrorMessage').innerText = 'Passwords Do Not Match';
        document.forms.register.cPassword.setCustomValidity('Passwords do not match');
    }
}

function showAlert(alertId) {
    document.getElementById(alertId).classList.remove('d-none');
    setTimeout(() => document.getElementById(alertId).classList.add('d-none'), 2000);
}

function redirectUserBasedOnType(type) {
    console.log("Weiterleitender Benutzertyp:", type);
    if (type === 0) {
        window.location.href = 'admin/admin.html';
    } else if (type === 1) {
        window.location.href = 'student/student.html';
    }
}