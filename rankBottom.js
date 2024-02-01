let id1;
let id2;
let unrankedMovies;
const unrankedResponse = await fetch('/getBottomUnranked');
if (unrankedResponse.ok) {
    unrankedMovies = await unrankedResponse.json();
}
getTwoMovies();

async function getTwoMovies() {
    if (unrankedMovies.length === 0) {
        document.getElementById('outOfMovies').innerHTML = 'Out of Movies';
        const rankingSection = document.getElementById('rankingsection');
        while (rankingSection.firstChild) {
            rankingSection.removeChild(rankingSection.firstChild);
        }
    }
    else {
        document.getElementById('movieTitle1').innerHTML = '';
        document.getElementById('movieTitle2').innerHTML = '';
        document.getElementById('poster1').src = '';
        document.getElementById('poster2').src = '';
        id1 = unrankedMovies[0]['id1'];
        const infoResponse1 = await fetch('/getInfo', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id1
            }),
        });
        if (infoResponse1.ok) {
            const infoJSON = await infoResponse1.json();
            const info = infoJSON[0];
            document.getElementById('poster1').src = info['poster'];
            if (info['year'] !== 0) {
                document.getElementById('movieTitle1').innerHTML = info['title'] + ' (' + info['year'].toString() + ')';
            }
            else {
                document.getElementById('movieTitle1').innerHTML = info['title'];
            }
        }
        id2 = unrankedMovies[0]['id2'];
        const infoResponse2 = await fetch('/getInfo', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: id2
            }),
        });
        if (infoResponse2.ok) {
            const infoJSON = await infoResponse2.json();
            const info = infoJSON[0];
            document.getElementById('poster2').src = info['poster'];
            if (info['year'] !== 0) {
                document.getElementById('movieTitle2').innerHTML = info['title'] + ' (' + info['year'].toString() + ')';
            }
            else {
                document.getElementById('movieTitle2').innerHTML = info['title'];
            }
        }
    }
}

if (document.getElementById('movieButton1') !== undefined) {
    document.getElementById('movieButton1').addEventListener('click', async () => {
        await fetch('/submitRanking', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winner: id1,
                loser: id2,
                id1: id1,
                id2: id2
            }),
        });
        unrankedMovies.shift();
        getTwoMovies();
    })
}

if (document.getElementById('movieButton2') !== undefined) {
    document.getElementById('movieButton2').addEventListener('click', async () => {
        await fetch('/submitRanking', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winner: id2,
                loser: id1,
                id1: id1,
                id2: id2
            }),
        });
        unrankedMovies.shift();
        getTwoMovies();
    })
}

if (document.getElementById('skipButton') !== undefined) {
    document.getElementById('skipButton').addEventListener('click', async () => {
        unrankedMovies.shift();
        getTwoMovies();
    })
}

if (document.getElementById('smartWin1') !== undefined) {
    document.getElementById('smartWin1').addEventListener('click', async () => {
        const response = await fetch('/submitSmartRanking', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winner: id1,
                loser: id2,
                id1: id1,
                id2: id2
            }),
        });
        if (response.ok) {
            const newUnrankedResponse = await fetch('/getUnranked');
            if (newUnrankedResponse.ok) {
                const newUnrankedMovies = await newUnrankedResponse.json();
                unrankedMovies.shift()
                const newUnrankedMoviesSet = new Set(newUnrankedMovies.map(y => JSON.stringify(y)));
                unrankedMovies = unrankedMovies.filter(x => {return newUnrankedMoviesSet.has(JSON.stringify(x))});
                getTwoMovies();
            }
        }
    })
}

if (document.getElementById('smartWin2') !== undefined) {
    document.getElementById('smartWin2').addEventListener('click', async () => {
        const response = await fetch('/submitSmartRanking', {
            method: "POST",
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winner: id2,
                loser: id1,
                id1: id1,
                id2: id2
            }),
        });
        if (response.ok) {
            const newUnrankedResponse = await fetch('/getUnranked');
            if (newUnrankedResponse.ok) {
                const newUnrankedMovies = await newUnrankedResponse.json();
                unrankedMovies.shift()
                const newUnrankedMoviesSet = new Set(newUnrankedMovies.map(y => JSON.stringify(y)));
                unrankedMovies = unrankedMovies.filter(x => {return newUnrankedMoviesSet.has(JSON.stringify(x))});
                getTwoMovies();
            }
        }
    });
}