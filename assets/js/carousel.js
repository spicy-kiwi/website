// Rezept-Karussell: Pfeile blättern um die sichtbaren Karten weiter.
// Wischen und Scrollen funktionieren auch ohne JS (CSS scroll-snap).
document.querySelectorAll('.recipe-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.recipe-carousel-track');
    const prev = carousel.querySelector('.recipe-carousel-prev');
    const next = carousel.querySelector('.recipe-carousel-next');
    if (!track || !prev || !next) return;

    const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        prev.hidden = track.scrollLeft <= 1;
        next.hidden = track.scrollLeft >= max - 1;
    };

    const page = (direction) => {
        track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
    };

    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
});
