const userResponse = await fetch('/userLists');
if (userResponse.ok) {
    const lists = await userResponse.json();
    const dropdown = document.getElementById('userLists');
    lists.forEach(result => {
        const element = document.createElement('option');
        element.innerHTML = result['list'];
        element.value = result['list'];
        dropdown.appendChild(element);
    });
}

document.getElementById('createList').addEventListener('click', async () => {
    const listName = document.getElementById('newList').value;
    const response = await fetch('/createList', {
        method: "POST",
        redirect: 'follow',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listName: listName }),
    });
    if (response.ok) {
        const results = await response.json();
        if (results['success']) {
            document.getElementById('confirmationMessage').innerHTML = results['msg'];
            const element = document.createElement('option');
            element.innerHTML = listName;
            element.value = listName;
            element.id = listName;
            const dropdown = document.getElementById('userLists');
            dropdown.appendChild(element);
        }
    }
});

document.getElementById('deleteList').addEventListener('click', async () => {
    const listName = document.getElementById('userLists').value;
    if (window.confirm("Delete " + listName)) {
        await fetch('/deleteList', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listName: listName }),
        });
        location.reload();
    }
});