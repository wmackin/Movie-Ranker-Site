let id1;
let id2;
let unrankedMovies;
let rankType;

const typeResponse = await fetch('/rankType');
if (typeResponse.ok) {
    const typeJSON = await typeResponse.json();
    rankType = typeJSON['type'];
}

getTwoMovies();

async function getTwoMovies() {
        let pct = 0.9;
        while (pct >= 0) {
            const unrankedResponse = await fetch('/getUnranked', {
                method: "POST",
                redirect: 'follow',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pct: pct
                }),
            });
            if (unrankedResponse.ok) {
                unrankedMovies = await unrankedResponse.json();
                if (unrankedMovies.length === 0) {
                    pct -= 0.1;
                }
                else {
                    break;
                }
            }
            else {
                console.log("Error is here.")
            }
        }
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
        else {
            console.log("infoResponse1 is not ok");
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
        else {
            console.log("infoResponse2 is not ok");
        }
    }
}

if (document.getElementById('movieButton1') !== undefined) {
    document.getElementById('movieButton1').addEventListener('click', async () => {
        document.getElementById('movieTitle1').innerHTML = '';
        document.getElementById('movieTitle2').innerHTML = '';
        document.getElementById('poster1').src = '';
        document.getElementById('poster2').src = '';
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
        getTwoMovies();
    })
}

if (document.getElementById('movieButton2') !== undefined) {
    document.getElementById('movieButton2').addEventListener('click', async () => {
        document.getElementById('movieTitle1').innerHTML = '';
        document.getElementById('movieTitle2').innerHTML = '';
        document.getElementById('poster1').src = '';
        document.getElementById('poster2').src = '';
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
        getTwoMovies();
    })
}

if (document.getElementById('smartWin1') !== undefined) {
    document.getElementById('smartWin1').addEventListener('click', async () => {
        document.getElementById('movieTitle1').innerHTML = '';
        document.getElementById('movieTitle2').innerHTML = '';
        document.getElementById('poster1').src = '';
        document.getElementById('poster2').src = '';
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
            getTwoMovies();
        }
    })
}

if (document.getElementById('smartWin2') !== undefined) {
    document.getElementById('smartWin2').addEventListener('click', async () => {
        document.getElementById('movieTitle1').innerHTML = '';
        document.getElementById('movieTitle2').innerHTML = '';
        document.getElementById('poster1').src = '';
        document.getElementById('poster2').src = '';
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
            getTwoMovies();
        }
    });
}