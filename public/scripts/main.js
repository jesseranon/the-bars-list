const LIKE_BUTTONS = Array.from(document.querySelectorAll('.like'));
const DISLIKE_BUTTONS = Array.from(document.querySelectorAll('.dislike'));
const LS = window.localStorage;

LIKE_BUTTONS.forEach(async likeButton => {
    likeButton.addEventListener('click', async e => {
        const bar = getBarProperties(e.currentTarget);

        let lsBar = LS.getItem(bar.barLyrics);

        if (!lsBar) {
            //if it's not already in local storage, it hasn't been counted toward likes/dislikes
            LS.setItem(bar.barLyrics, 'like');
            bar.barLikes += 1;
        } else {
            //if it's already in local storage, it has already been counted toward likes/dislikes
            if (lsBar == 'like') {
                LS.removeItem(bar.barLyrics);
                bar.barLikes -= 1;
            } else if (lsBar == 'dislike') {
                LS.setItem(bar.barLyrics, 'like');
                bar.barLikes += 1;
                bar.barDislikes -= 1;
            }
        }

        lsBar = LS.getItem(bar.barLyrics);
        console.log('barLikes', bar.barLikes);
        console.log('barDislikes', bar.barDislikes);
        console.log(lsBar);

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
        console.log('barLikes', bar.barLikes);
        console.log('barDislikes', bar.barDislikes);
        console.log(lsBar);

        //send post to update dislikes
        await putVote(bar);
    });
});

function getBarProperties(buttonElement) {
    const liBar = buttonElement.closest('.bar');
    console.log(liBar);
    const barLyrics = liBar.querySelector('blockquote').innerText;
    const barLikes = Number(liBar.querySelector('.like').getAttribute('value'));
    const barDislikes = Number(liBar.querySelector('.dislike').getAttribute('value'));

    return { barLyrics, barLikes, barDislikes }
}

async function putVote(obj) {
    try {
        const response = await fetch('addVote', {
            method: 'put',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(obj)
        });
        const data = await response.json();

        location.reload();
    }
    catch (error) {
        console.error(error);
    }
}

window.addEventListener('DOMContentLoaded', e => {
    const barsListItems = Array.from(document.querySelectorAll('.bar'));
    barsListItems.forEach(bar => {
        const barLyrics = bar.querySelector('blockquote').innerText;
        const barStorage = LS.getItem(barLyrics);
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
    });
    let ls = Array.from(Object.keys(window.localStorage));
});