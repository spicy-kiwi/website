// Dropdown unter "Rezepte": per Klick/Tipp öffnen, mit Escape oder Klick daneben schließen.
// Auf Geräten mit Maus öffnet es zusätzlich per Hover (CSS).
document.querySelectorAll('.tagmenu').forEach((menu) => {
    const toggle = menu.querySelector('.tagmenu-toggle');
    if (!toggle) return;

    const setOpen = (open) => {
        menu.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        setOpen(!menu.classList.contains('is-open'));
    });

    document.addEventListener('click', (event) => {
        if (!menu.contains(event.target)) setOpen(false);
    });

    menu.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setOpen(false);
            toggle.focus();
        }
    });
});
