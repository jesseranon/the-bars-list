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
            const result = confirm(`Are you sure you want to delete this bar? \n
            ${bar.barLyrics}\n
            ${bar.barRapper}, ${bar.barSong}`);
            if (result) {
                await deleteBar(bar);
            }
        });
    });

    const editButtons = Array.from(document.querySelectorAll('.bar-edit'));

    editButtons.forEach(async editButton => {
        editButton.addEventListener('click', async e => {
            const bar = getBarProperties(e.currentTarget);
            await editBar(e.currentTarget, bar);
        });
    });
    // let ls = Array.from(Object.keys(window.localStorage));
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

/* BAR EDIT FUNCTIONS */
async function editBar(target) {
    const liBar = target.closest('.bar');
    const bar = getBarProperties(target);
    const barLyricsEl = liBar.querySelector('figure');
    //hide figure elements
    hideBarFigureElements(liBar);
    //hide bar control
    hideBarControl(liBar);
    //render edit bar form
    await renderEditBarForm(liBar, bar);
    //add event listeners to edit bar form
}

function cancelEdit(barElement) {
    const figure = barElement.querySelector('figure');
    const form = barElement.querySelector('form');

    unhideBarControl(barElement);
    figure.removeChild(form);
    unhideBarFigureElements(barElement);
}

/* BAR EDIT ELEMENTS STUFF */
function hideBarFigureElements(barElement) {
    const figure = barElement.querySelector('figure');
    Array.from(figure.children).forEach(el => {
        el.classList.add('hidden');
    });
}

function unhideBarFigureElements(barElement) {
    const figure = barElement.querySelector('figure');
    Array.from(figure.children).forEach(el => {
        el.classList.remove('hidden');
    });
}

function hideBarControl(barElement) {
    const barControl = barElement.querySelector('.bar-control');
    Array.from(barControl.querySelectorAll('button')).forEach(button => {
        button.classList.add('hidden');
    });
}

function unhideBarControl(barElement) {
    const barControl = barElement.querySelector('.bar-control');
    Array.from(barControl.querySelectorAll('button')).forEach(button => {
        button.classList.remove('hidden');
    });
}

async function renderEditBarForm(barElement, barObj) {
    /*
    <form>
        <textarea> lyrics
        <input> artist
        <input> song
        <button> cancel
        <button> submit edits
    <form>
    */
    const form = document.createElement('form');
    form.classList.add('edit-bar');
    const bar = barObj;
    const lyricsInput = document.createElement('textarea');
    lyricsInput.classList.add('edit-lyrics');
    lyricsInput.value = bar.barLyrics;
    const br = document.createElement('br');
    const rapperInput = document.createElement('input');
    rapperInput.classList.add('edit-rapper');
    rapperInput.value = bar.barRapper;
    const songInput = document.createElement('input');
    songInput.classList.add('edit-song');
    songInput.value = bar.barSong;

    const editCancel = document.createElement('button');
    editCancel.textContent = 'Cancel';
    const editSubmit = document.createElement('button');
    editSubmit.textContent = 'Submit edit.';

    const figure = barElement.querySelector('figure');

    editCancel.addEventListener('click', e => {
        e.preventDefault();
        cancelEdit(barElement);
    });

    editSubmit.addEventListener('click', async e => {
        e.preventDefault();
        await submitEdit(e.currentTarget);
    });

    [lyricsInput, br, rapperInput, songInput, editCancel, editSubmit].forEach(el => {
        form.appendChild(el);
    });

    figure.appendChild(form);
}

async function submitEdit(buttonElement) {
    const submitObj = {};
    const barElement = buttonElement.closest('.bar');

    submitObj.barId = barElement.getAttribute('value');
    submitObj.barLyrics = barElement.querySelector('.edit-lyrics').value;
    submitObj.barRapper = barElement.querySelector('.edit-rapper').value;
    submitObj.barSong = barElement.querySelector('.edit-song').value;

    try {
        const response = await fetch('editBar', {
            method: 'put',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submitObj)
        });
        const data = await response.json();
        console.log(data);
        window.location.reload(true);
    }
    catch (error) {
        console.error(error);
    }
}