// Schalter neben "Anleitung": hält den Bildschirm beim Kochen an.
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('wakeLock');
    if (!wrapper || !('wakeLock' in navigator)) return;

    const toggle = document.getElementById('wakeLockToggle');
    let lock = null;

    const acquire = async () => {
        try {
            lock = await navigator.wakeLock.request('screen');
            lock.addEventListener('release', () => { lock = null; });
        } catch (e) {
            toggle.checked = false;
        }
    };

    toggle.addEventListener('change', () => toggle.checked ? acquire() : lock?.release());

    // Der Browser gibt die Sperre beim Tab-Wechsel frei, danach neu anfordern.
    document.addEventListener('visibilitychange', () => {
        if (toggle.checked && !lock && document.visibilityState === 'visible') acquire();
    });

    wrapper.hidden = false;
});
