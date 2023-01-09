document.getElementById('searchMovie').addEventListener('click', async e => {
    const keyResponse = await fetch('/getAPIKey', { headers: { 'Content-Type': 'application/text' } });
    if (keyResponse.ok) {
        const key = await keyResponse.json();
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': key['value'],
                'X-RapidAPI-Host': 'movie-database-alternative.p.rapidapi.com'
            }
        };
        const search = document.getElementById('movieSearch').value;
        const response = await fetch(`https://movie-database-alternative.p.rapidapi.com/?s=${search}&r=json&page=1`, options);
        if (response.ok) {
            const request = await response.json();
            const data = request['Search'];
            const userResponse = await fetch('/userLists');
            if (userResponse.ok) {
                const lists = await userResponse.json();
                const dropdown = document.createElement('select');
                lists.forEach(result => {
                    const element = document.createElement('option');
                    element.innerHTML = result['list'];
                    element.value = result['list'];
                    dropdown.appendChild(element);
                });
                if (data !== undefined) {
                    document.getElementById('searchOutput').innerHTML = '';
                    for (let i = 0; i < Math.min(data.length, 10); i++) {
                        const img = data[i]["Poster"];
                        const name = data[i]["Title"];
                        const year = data[i]["Year"];
                        const id = data[i]["imdbID"];
                        const imgNode = document.createElement('img');
                        imgNode.src = img;
                        const heading = document.createElement('h1');
                        heading.innerHTML = `${name} (${year})`;
                        const dropdownCopy = dropdown.cloneNode(true);
                        const addToList = document.createElement('button');
                        addToList.innerHTML = 'Add to list';
                        const errorText = document.createElement('p');
                        errorText.class = 'error';
                        addToList.addEventListener('click', async () => {
                            const listName = dropdownCopy.options[dropdownCopy.selectedIndex].value;;
                            const addResponse = await fetch('/addToList', {
                                method: "POST",
                                redirect: 'follow',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    listName: listName, id: id, title: name,
                                    year: year, poster: img
                                }),
                            });
                            if (addResponse.ok) {
                                const addMsg = await addResponse.json();
                                errorText.innerHTML = addMsg['msg'];
                            }
                        });
                        const resultDiv = document.createElement('div');
                        resultDiv.id = id;
                        resultDiv.appendChild(imgNode);
                        resultDiv.appendChild(heading);
                        resultDiv.appendChild(dropdownCopy);
                        resultDiv.appendChild(addToList);
                        resultDiv.appendChild(errorText);
                        resultDiv.appendChild(document.createElement('br'));
                        resultDiv.appendChild(document.createElement('br'));
                        document.getElementById('searchOutput').appendChild(resultDiv);
                    }
                }
                else {
                    document.getElementById('searchOutput').innerHTML = '<p>No results.</p>';
                }
                // if (data !== undefined) {
                //     for (let i = 0; i < Math.min(data.length, 10); i++) {
                //         const id = data[i]["imdbID"];
                //         const element = document.getElementById(id);
                //         const button = element.getElementsByTagName('button')[];
                //         console.log(button);
                //         button.addEventListener('click', () => {

                //         });
                //     };
                // }
            }
        }
    }
});

document.getElementById('searchID').addEventListener('click', async e => {
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': 'c6609e233bmsh4537c819c3a8d4cp198905jsn3792519320e0',
            'X-RapidAPI-Host': 'movie-database-alternative.p.rapidapi.com'
        }
    };
    const movieID = document.getElementById('idSearch').value;
    const response = await fetch(`https://movie-database-alternative.p.rapidapi.com/?i=${movieID}`, options);
    if (response.ok) {
        const data = await response.json();
        if (data["Response"] === "True") {
            const img = data["Poster"];
            const name = data["Title"];
            const year = data["Year"];
            const id = data["imdbID"];
            const imgNode = document.createElement('img');
            imgNode.src = img;
            const heading = document.createElement('h1');
            heading.innerHTML = `${name} (${year})`;
            const dropdownCopy = dropdown.cloneNode(true);
            const addToList = document.createElement('button');
            addToList.innerHTML = 'Add to list';
            const errorText = document.createElement('p');
            errorText.class = 'error';
            addToList.addEventListener('click', async () => {
                const listName = dropdownCopy.options[dropdownCopy.selectedIndex].value;
                const addResponse = await fetch('/addToList', {
                    method: "POST",
                    redirect: 'follow',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        listName: listName, id: id, title: name,
                        year: year, poster: img
                    }),
                });
                if (addResponse.ok) {
                    const addMsg = await addResponse.json();
                    errorText.innerHTML = addMsg['msg'];
                }
            });
            const resultDiv = document.createElement('div');
            resultDiv.id = id;
            resultDiv.appendChild(imgNode);
            resultDiv.appendChild(heading);
            resultDiv.appendChild(dropdownCopy);
            resultDiv.appendChild(addToList);
            resultDiv.appendChild(errorText);
            resultDiv.appendChild(document.createElement('br'));
            resultDiv.appendChild(document.createElement('br'));
            document.getElementById('searchOutput').appendChild(resultDiv);
        }
        else {
            document.getElementById('searchOutput').innerHTML = '<p>No results.</p>';
        }
    }
});