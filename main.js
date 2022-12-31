document.getElementById('searchMovie').addEventListener('click', async e => {

    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': 'c6609e233bmsh4537c819c3a8d4cp198905jsn3792519320e0',
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
            content = 'No results.'
        }
        document.getElementById('searchOutput').innerHTML = content;
    }
});