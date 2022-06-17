const SUBMIT_BUTTON = document.querySelector('#submit-bar');
const LIKE_BUTTONS = Array.from(document.querySelectorAll('.like'));
const DISLIKE_BUTTONS = Array.from(document.querySelectorAll('.dislike'));
const FORM_LYRICS = document.querySelector('#barLyrics');
const FORM_RAPPER = document.querySelector('#barRapper');;
const FORM_SONG = document.querySelector('#barSong');;
const LS = window.localStorage;

SUBMIT_BUTTON.addEventListener('click', async e => {
    e.preventDefault();
    const bar = {
        barLyrics: FORM_LYRICS.value,
        barRapper: FORM_RAPPER.value,
        barSong: FORM_SONG.value
    }
    await postBar(bar);
});

LIKE_BUTTONS.forEach(async likeButton => {
    likeButton.addEventListener('click', async e => {
        const bar = getBarProperties(e.currentTarget);

        let lsBar = LS.getItem(bar._id);

        if (!lsBar) {
            //if it's not already in local storage, it hasn't been counted toward likes/dislikes
            LS.setItem(bar._id, 'like');
            bar.barLikes += 1;
        } else {
            //if it's already in local storage, it has already been counted toward likes/dislikes
            if (lsBar == 'like') {
                LS.removeItem(bar._id);
                bar.barLikes -= 1;
            } else if (lsBar == 'dislike') {
                LS.setItem(bar.barLyrics, 'like');
                bar.barLikes += 1;
                bar.barDislikes -= 1;
            }
        }

        lsBar = LS.getItem(bar.barLyrics);

        // send post to update likes
        await putVote(bar);
    });
});

DISLIKE_BUTTONS.forEach(async dislikeButton => {
    dislikeButton.addEventListener('click', async e => {
        const bar = getBarProperties(e.currentTarget);
        console.log(bar);
        let lsBar = LS.getItem(bar.barLyrics);

        if (!lsBar) {
            LS.setItem(bar.barLyrics, 'dislike');
            bar.barDislikes += 1;
        } else {
            if (lsBar == 'dislike') {
                LS.removeItem(bar.barLyrics);
                bar.barDislikes -= 1;
            } else if (lsBar == 'like') {
                LS.setItem(bar.barLyrics, 'dislike');
                bar.barLikes -= 1;
                bar.barDislikes += 1;
            }
        }

        lsBar = LS.getItem(bar.barLyrics);

        //send post to update dislikes
        await putVote(bar);
    });
});

function getBarProperties(buttonElement) {
    const liBar = buttonElement.closest('.bar');
    console.log(liBar);
    const barId = liBar.querySelector('blockquote').value; 
    const barLyrics = liBar.querySelector('blockquote').innerText;
    const barRapper = liBar.querySelector('.barRapper').innerText;
    const barSong = liBar.querySelector('.barSong').innerText;
    const barLikes = Number(liBar.querySelector('.like').getAttribute('value'));
    const barDislikes = Number(liBar.querySelector('.dislike').getAttribute('value'));

    return { barId, barLyrics, barRapper, barSong, barLikes, barDislikes };
}

async function putVote(obj) {
    try {
        const response = await fetch('addVote', {
            method: 'put',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(obj)
        });
        const data = await response.json();
        window.location.reload(true);
    }
    catch (error) {
        console.error(error);
    }
}

async function postBar(obj) {
    console.log(obj);
    try {
        let response = await fetch('addBar', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(obj)
        });
        console.log(response);
        if (response.bodyUsed) {
            
        }
        let data = await response.json();
        console.log(data);
        if (data.insertedId && !data.message) {
            let newBarId = data.insertedId;
            LS.setItem(newBarId, 'created');
        }

        window.location.reload(true);
    } catch (err) {
        console.log(err);
    }
}

window.addEventListener('DOMContentLoaded', e => {
    const barsListItems = Array.from(document.querySelectorAll('.bar'));
    barsListItems.forEach(bar => {
        const barId = bar.querySelector('blockquote').getAttribute('value');
        const barStorage = LS.getItem(barId);
        if (barStorage == 'like') {
            [bar.querySelector('.like'), bar.querySelector('.votes')].forEach(el => {
                el.classList.add('liked');
            });    
        }
        if (barStorage == 'dislike') {
            [bar.querySelector('.dislike'), bar.querySelector('.votes')].forEach(el => {
                el.classList.add('disliked');
            });
        }
        if (barStorage == 'created') {
            console.log(barId, 'created');
            console.log(`add edit and delete buttons to bar id ${barId}`);
        }
    });
    let ls = Array.from(Object.keys(window.localStorage));
});