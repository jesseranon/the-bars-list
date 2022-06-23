const SUBMIT_BUTTON = document.querySelector('#submit-bar');
const LIKE_BUTTONS = Array.from(document.querySelectorAll('.like'));
const DISLIKE_BUTTONS = Array.from(document.querySelectorAll('.dislike'));
const VOTE_BUTTONS = LIKE_BUTTONS.concat(DISLIKE_BUTTONS);
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

VOTE_BUTTONS.forEach(async button => {
    button.addEventListener('click', async e => {
        const target = e.currentTarget;
        const bar = getBarProperties(target);
        const lsBar = LS.getItem(bar.barId);
        const action = target.classList[0];
        const barParam = `bar${action.charAt(0).toUpperCase().concat(action.slice(1), 's')}`;
        const oppositeParam = (barParam === 'barLikes') ? 'barDislikes' : 'barLikes';
        
        const sendAction = {};
        if (lsBar == action) {
            console.log('localstorage equal to action clicked');
            sendAction[barParam] = 'decrement';
        } else {
            console.log('localstorage not equal to action clicked');
            if (lsBar && lsBar != action) {
                console.log('localstorage exists and is not equal to action clicked');
                sendAction[oppositeParam] = 'decrement';
            }
            sendAction[barParam] = 'increment';
        }

        bar.sendAction = sendAction;
        console.log(bar.sendAction);

        await putVote(bar);
    });
});

window.addEventListener('DOMContentLoaded', e => {
    const barsListItems = Array.from(document.querySelectorAll('.bar')); //adapt getBarProperties function to look at .bar elements?
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

    //setting delete buttons
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

    //setting edit buttons
    const editButtons = Array.from(document.querySelectorAll('.bar-edit'));

    editButtons.forEach(async editButton => {
        editButton.addEventListener('click', async e => {
            const bar = getBarProperties(e.currentTarget);
            await editBar(e.currentTarget, bar);
        });
    });
    
    // clear unlisted items from localstorage
    if (LS.length > 0) {
        let ls = Object.keys(LS);
        const barIds = barsListItems.map(b => b.getAttribute('value'));
        const barLyrics = barsListItems.map(b => b.querySelector('blockquote').innerText);
        console.log(ls);
        console.log(barIds);
        console.log(barLyrics);
        for (const item of ls) {
            if (!barIds.includes(item) && !barLyrics.includes(item)) LS.removeItem(item);
        }
        console.log(LS);
    }
});

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
        if (data.success) {
            const bodyActions = data.bodyActions;
            for (const action of Object.keys(bodyActions)) {
                if (bodyActions[action] === 'decrement') LS.removeItem(data.id);
                if (bodyActions[action] === 'increment') {
                    let localStorageValue = action.charAt(3).toLowerCase().concat(action.slice(4, -1));
                    LS.setItem(data.id, localStorageValue);    
                }
            }
        }
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

async function submitEdit(barElement) {
    const submitObj = {};

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

//HELPER FUNCTIONS
function getBarProperties(element) {
    let liBar;
    if (!element.classList.contains('bar')) liBar = element.closest('.bar');
    else liBar = element;

    return {
        barId: liBar.getAttribute('value'),
        barLyrics: liBar.querySelector('blockquote').innerText,
        barRapper: liBar.querySelector('.barRapper').innerText,
        barSong: liBar.querySelector('.barSong').innerText,
        barLikes: Number(liBar.querySelector('.like').getAttribute('value')),
        barDislikes: Number(liBar.querySelector('.dislike').getAttribute('value'))
    }
}

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
    const bar = barObj;

    const form = document.createElement('form');
    form.classList.add('edit-bar');

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
    editSubmit.textContent = 'Submit edit';

    const figure = barElement.querySelector('figure');

    editCancel.addEventListener('click', e => {
        e.preventDefault();
        cancelEdit(barElement);
    });

    editSubmit.addEventListener('click', async e => {
        e.preventDefault();
        await submitEdit(barElement);
    });

    [lyricsInput, br, rapperInput, songInput, editCancel, editSubmit].forEach(el => {
        form.appendChild(el);
    });

    figure.appendChild(form);
}