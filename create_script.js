document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.querySelector('.zigzag-gallery');
    const inputs = document.querySelectorAll('.minimal-input');

    inputs.forEach(input => {
        // When user clicks inside either the title or description textboxes
        input.addEventListener('focus', () => {
            gallery.classList.add('paused');
        });

        // When the user clicks away from the textboxes, movement starts up again
        input.addEventListener('blur', () => {
            gallery.classList.remove('paused');
        });
    });
});
