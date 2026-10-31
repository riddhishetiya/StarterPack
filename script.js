document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('hotCornerTrigger');
    const panel = document.getElementById('historyOverlayPanel');

    if (!trigger || !panel) return;

    // 1. OPEN: Trigger the layout to slide into view when hitting the hot corner hotspot
    trigger.addEventListener('mouseenter', () => {
        panel.classList.add('active');
    });

    // 2. CLOSE: Dismiss the folder ONLY when clicking outside on the background screen backdrop
    panel.addEventListener('click', (e) => {
        // If the element clicked is exactly the backdrop layout wrapper (and not the folder board itself)
        if (e.target === panel) {
            panel.classList.remove('active');
        }
    });
});

const slider = document.querySelector('.page-slider-wrapper');
const locker = document.querySelector('.side-locker-trigger');
const backButton = document.querySelector('.back-home-btn');

function openInteractions() {
    slider.classList.add('shift-right');
    locker.classList.add('hidden');
}

function closeInteractions() {
    slider.classList.remove('shift-right');
    locker.classList.remove('hidden');
}

locker.addEventListener('click', openInteractions);

backButton.addEventListener('click', closeInteractions);
