document.getElementById('searchMovie').addEventListener('click', async e => {
    const keyResponse = await fetch('/getAPIKey', {headers: {'Content-Type': 'application/text'}});
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
        let content = '';
        if (response.ok) {
            const request = await response.json();
            const data = request['Search'];
            if (data !== undefined) {
                for (let i = 0; i < Math.min(data.length, 10); i++) {
                    const img = data[i]["Poster"];
                    const name = data[i]["Title"];
                    const year = data[i]["Year"];
                    content += `<img src=${img}><h1>${name} (${year})</h1>`;
                }
            }
            else {
                content = '<p>No results.</p>'
            }
            document.getElementById('searchOutput').innerHTML = content;
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
    let content = '';
    if (response.ok) {
        const data = await response.json();
        if (data["Response"] === "True") {
            const img = data["Poster"];
            const name = data["Title"];
            const year = data["Year"];
            content += `<img src=${img}><h1>${name} (${year})</h1>`;
        }
        else {
            content = '<p>No results.</p>'
        }
        document.getElementById('searchOutput').innerHTML = content;
    }
});