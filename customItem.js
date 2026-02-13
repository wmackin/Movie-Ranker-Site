//to-do: make custom items prompt for auto rank score

const dropdown = document.getElementById('listDropdown');
const userResponse = await fetch('/userLists');
if (userResponse.ok) {
    const lists = await userResponse.json();
    lists.forEach(result => {
        const element = document.createElement('option');
        element.innerHTML = result['list'];
        element.value = result['list'];
        dropdown.appendChild(element);
    });
}

const errorText = document.getElementById('errorText');

document.getElementById('addCustomItem').addEventListener('click', async () => {
    const autorankScore = window.parseInt(window.prompt('Select a score for autoranking'));
    const listName = dropdown.options[dropdown.selectedIndex].value;;
    let year = document.getElementById('customYear').value;
    if (!year) {
        year = 0;
    }
    const name = document.getElementById('customName').value;
    const img = document.getElementById('customImg').value;
    const addResponse = await fetch('/addToList', {
        method: "POST",
        redirect: 'follow',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            listName: listName, id: name, title: name,
            year: year, poster: img, autorankScore: autorankScore
        }),
    });
    if (addResponse.ok) {
        const addMsg = await addResponse.json();
        errorText.innerHTML = addMsg['msg'];
    }
});

document.getElementById('removeCustomItem').addEventListener('click', async () => {
    const listName = dropdown.options[dropdown.selectedIndex].value;;
    let year = document.getElementById('customYear').value;
    if (!year) {
        year = 0;
    }
    const name = document.getElementById('customName').value;
    const img = document.getElementById('customImg').value;
    const addResponse = await fetch('/removeFromList', {
        method: "POST",
        redirect: 'follow',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            listName: listName, id: name, title: name,
            year: year, poster: img
        }),
    });
    if (addResponse.ok) {
        const addMsg = await addResponse.json();
        errorText.innerHTML = addMsg['msg'];
    }
});