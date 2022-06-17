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

        let lsBar = LS.getItem(bar.barId);

        if (!lsBar) {
            //if it's not already in local storage, it hasn't been counted toward likes/dislikes
            LS.setItem(bar.barId, 'like');
            bar.barLikes += 1;
        } else {
            //if it's already in local storage, it has already been counted toward likes/dislikes
            if (lsBar == 'like') {
                LS.removeItem(bar.barId);
                bar.barLikes -= 1;
            } else if (lsBar == 'dislike') {
                LS.setItem(bar.barId, 'like');
                bar.barLikes += 1;
                bar.barDislikes -= 1;
            }
        }

        lsBar = LS.getItem(bar.barId);

        // send post to update likes
        await putVote(bar);
    });
});

DISLIKE_BUTTONS.forEach(async dislikeButton => {
    dislikeButton.addEventListener('click', async e => {
        const bar = getBarProperties(e.currentTarget);
        // console.log(bar);
        let lsBar = LS.getItem(bar.barId);

        if (!lsBar) {
            LS.setItem(bar.barId, 'dislike');
            bar.barDislikes += 1;
        } else {
            if (lsBar == 'dislike') {
                LS.removeItem(bar.barId);
                bar.barDislikes -= 1;
            } else if (lsBar == 'like') {
                LS.setItem(bar.Id, 'dislike');
                bar.barLikes -= 1;
                bar.barDislikes += 1;
            }
        }

        lsBar = LS.getItem(bar.barId);

        //send post to update dislikes
        await putVote(bar);
    });
});

function getBarProperties(buttonElement) {
    const liBar = buttonElement.closest('.bar');
    // console.log(liBar);
    const barId = liBar.getAttribute('value'); 
    const barLyrics = liBar.querySelector('blockquote').innerText;
    const barRapper = liBar.querySelector('.barRapper').innerText;
    const barSong = liBar.querySelector('.barSong').innerText;
    const barLikes = Number(liBar.querySelector('.like').getAttribute('value'));
    const barDislikes = Number(liBar.querySelector('.dislike').getAttribute('value'));

    return { barId, barLyrics, barRapper, barSong, barLikes, barDislikes };
}

async function postBar(obj) {
    console.log(obj);
    try {
        let response = await fetch('addBar', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(obj)
        });
        let data = await response.json();
        console.log(data);
        if (data.insertedId && !data.message) {
            let newBarId = data.insertedId;
            LS.setItem(newBarId, 'created');
        }

        window.location.reload(true);
    } catch (err) {
        console.error(err);
    }
}

async function putVote(obj) {
    try {
        const response = await fetch('addVote', {
            method: 'put',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(obj)
        });
        const data = await response.json();
        console.log(data);
        window.location.reload(true);
    }
    catch (error) {
        console.error(error);
    }
}

async function deleteBar(obj) {
    console.log(obj);
    const id = obj.barId;
    const ls = LS.getItem(id);
    console.log(ls);
    if (ls == 'created') {
        
        try {
            const response = await fetch(`delete/${id}`, {
                method: 'delete',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(obj)
            })
            const data = await response.json();
            console.log(data);
            LS.removeItem(data._id);
            window.location.reload(true);
        } catch (error) {
            console.error(error);
        }
    }
    else return console.log('You did not submit this bar');
}

window.addEventListener('DOMContentLoaded', e => {
    const barsListItems = Array.from(document.querySelectorAll('.bar'));
    barsListItems.forEach(bar => {
        const barId = bar.getAttribute('value');
        const barLyrics = bar.querySelector('blockquote').innerText;
        const barStorageId = LS.getItem(barId);
        const barStorageLyric = LS.getItem(barLyrics);
        if (barStorageId == 'like' || barStorageLyric == 'like') {
            [bar.querySelector('.like'), bar.querySelector('.votes')].forEach(el => {
                el.classList.add('liked');
            });
        }
        if (barStorageId == 'dislike' || barStorageLyric == 'dislike') {
            [bar.querySelector('.dislike'), bar.querySelector('.votes')].forEach(el => {
                el.classList.add('disliked');
            });
        }
        if (barStorageId == 'created') {
            bar.classList.add('created');
            const controlEl = bar.querySelector('.bar-control');
            const barEdit = document.createElement('button');
            barEdit.classList.add('bar-button', 'bar-edit');
            barEdit.textContent = 'Edit';

            const barDelete = document.createElement('button');
            barDelete.classList.add('bar-button', 'bar-delete');
            barDelete.textContent = 'Delete';

            [barEdit, barDelete].forEach(el => {
                controlEl.appendChild(el);
            });
        }
    });

    const deleteButtons = Array.from(document.querySelectorAll('.bar-delete'));

    deleteButtons.forEach(async deleteButton => {
        deleteButton.addEventListener('click', async e => {
            const bar = getBarProperties(e.currentTarget);
            console.log(`delete button clicked for ${bar.barId}: ${bar.barLyrics}`);
            await deleteBar(bar);
        });
    });

    const editButtons = Array.from(document.querySelectorAll('.bar-edit'));

    editButtons.forEach(async editButton => {
        editButton.addEventListener('click', async e => {
            const bar = getBarProperties(e.currentTarget);
            console.log(`edit button clicked for ${bar.barId}: ${bar.barLyrics}`);
        });
    });
    // let ls = Array.from(Object.keys(window.localStorage));
});