const signupButton = document.getElementById('signupButton');
signupButton.addEventListener('click', async e => {
    const response = await fetch('/userExists', {
        method: "POST",
        headers:  {'Content-Type': 'application/json'},
        body: JSON.stringify({ "user": document.getElementById("username").value })
    });
    if (response.ok) {
        const userExists = await response.json();
        if (userExists['exists']) {
            document.getElementById('confirmError').innerHTML = "User already exists";
        }
        else {
            if (document.getElementById("confirmPassword").value === document.getElementById("password").value) {
                let data = JSON.stringify({
                    "user": document.getElementById("username").value,
                    "password": document.getElementById("password").value,
                });
                const response = await fetch('/createAccount', {
                    method: "POST",
                    redirect: "follow",
                    headers:  {'Content-Type': 'application/json'},
                    body: data,
                });
                if (response.ok) {
                    if (response.redirected) {
                        window.location.assign(response.url);
                    }
                }
            }
            else {
                document.getElementById('confirmError').innerHTML = "Passwords don't match";
            }
        }
    }
});