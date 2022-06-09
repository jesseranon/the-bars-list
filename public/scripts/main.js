const LIKE_BUTTONS = Array.from(document.querySelectorAll('.like'));

LIKE_BUTTONS.forEach(async likeButton => {
    likeButton.addEventListener('click', async e => {
        const liBar = e.currentTarget.closest('.bar');
        const barLyrics = liBar.querySelector('blockquote').innerText;
        const barLikes = Number(liBar.querySelector('.barLikes').innerText) + 1;
        const barRapper = liBar.querySelector('.barRapper').innerText;

        try {
            const response = await fetch('addLike', {
                method: 'put',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barLyrics,
                    barLikes
                })
            });
            const data = await response.json();

            location.reload();
        }
        catch (error) {
            console.error(error);
        }
        
    });
});