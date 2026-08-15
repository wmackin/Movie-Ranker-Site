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
    const autorankThreshold = document.getElementById('autorankThreshold').value;
    const response = await fetch('/createList', {
        method: "POST",
        redirect: 'follow',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listName: listName, autorankThreshold: autorankThreshold }),
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
        else {
            document.getElementById('confirmationMessage').innerHTML = results['msg'];
        }
    }
});

document.getElementById('enterRanking').addEventListener('click', async () => {
    const mode = document.getElementById('rankOptions').value;
    if (mode == 'View as Grid') {
        const listName = document.getElementById('userLists').value;
        const tagsFiltered = document.getElementById('tagFilter').value;
        const tagsList = tagsFiltered.split(',')
        console.log(tagsList)
        const response = await fetch('/getList', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listName: listName }),
        });
        if (response.ok) {
            const list = await response.json();
            const viewingDiv = document.getElementById('viewingDiv');
            viewingDiv.classList.add("grid-container");
            while (viewingDiv.firstChild) {
                viewingDiv.removeChild(viewingDiv.firstChild);
            }
            list.forEach(m => {
                const itemTags = m['tags'].split(',')
                if (tagsFiltered.length === 0 || tagsList.every(t => itemTags.includes(t))) {
                    const imgNode = document.createElement('img');
                    imgNode.src = m['poster'];
                    imgNode.classList.add('image-display')
                    const newDiv = document.createElement('div');
                    newDiv.classList.add('grid-item');
                    newDiv.appendChild(imgNode);
                    viewingDiv.appendChild(newDiv);
                }
            })
        }
    }
    else if (mode == 'View as List') {
        const listName = document.getElementById('userLists').value;
        const tagsFiltered = document.getElementById('tagFilter').value;
        const tagsList = tagsFiltered.split(',')
        const response = await fetch('/getList', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listName: listName }),
        });
        if (response.ok) {
            const list = await response.json();
            const viewingDiv = document.getElementById('viewingDiv');
            viewingDiv.classList.remove("grid-container");
            while (viewingDiv.firstChild) {
                viewingDiv.removeChild(viewingDiv.firstChild);
            }
            for (let i = 0; i < list.length; i++) {
                const itemTags = list[i]['tags'].split(',')
                if (tagsFiltered.length === 0 || tagsList.every(t => itemTags.includes(t))) {
                    const textNode = document.createElement('h3');
                    textNode.innerHTML = (i + 1).toString() + '. ' + list[i]['title']
                    const newDiv = document.createElement('div');
                    newDiv.appendChild(textNode);
                    viewingDiv.appendChild(newDiv);
                }
            }
        }
    }
    else if (mode == "Rank") {
        const listName = document.getElementById('userLists').value;
        const response = await fetch('/rankList', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listName: listName }),
        });
        if (response.ok) {
            if (response.redirected) {
                window.location.assign(response.url);
            }
        }
    }
    else if (mode == "Rank Top Movies") {
        const listName = document.getElementById('userLists').value;
        const response = await fetch('/rankListTop', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listName: listName }),
        });
        if (response.ok) {
            if (response.redirected) {
                window.location.assign(response.url);
            }
        }
    }
    else if (mode == "Rank Top(ish) Movies") {
        const autorankScore = window.parseInt(window.prompt('Select a score for autoranking score threshold'));
        const listName = document.getElementById('userLists').value;
        const response = await fetch('/rankListTopish', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listName: listName, autorankThreshold: autorankScore }),
        });
        if (response.ok) {
            if (response.redirected) {
                window.location.assign(response.url);
            }
        }
    }
    else if (mode == "Rank Least Ranked Movies") {
        const listName = document.getElementById('userLists').value;
        const response = await fetch('/rankListLeast', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listName: listName }),
        });
        if (response.ok) {
            if (response.redirected) {
                window.location.assign(response.url);
            }
        }
    }
    else if (mode == "Rename List") {
        const listName = document.getElementById('userLists').value;
        const newListName = window.prompt("Enter new list name");
        if (newListName !== null && newListName.length > 0) {
            const response = await fetch('/renameList', {
                method: "POST",
                redirect: 'follow',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldListName: listName, newListName: newListName }),
            });
            if (response.ok) {
                const results = await response.json();
                if (results['success']) {
                    location.reload();
                }
                else {
                    document.getElementById('confirmationMessage').innerHTML = results['msg'];
                }
            }
        }
    }
    else if (mode == "Reset List") {
        const listName = document.getElementById('userLists').value;
        if (window.confirm("Reset " + listName)) {
            await fetch('/resetList', {
                method: "POST",
                redirect: 'follow',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listName: listName }),
            });
        }
    }
    else if (mode == "Delete List") {
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
    }
    else {
        console.log("Something went wrong...")
    }
})