const SITE_THEME_KEY = 'siteTheme';

function normalizeTheme(theme) {
    if (theme === 'cyber') return 'green';
    if (theme === 'ocean') return 'blueeeee';
    return theme;
}

function getSavedTheme() {
    const stored = localStorage.getItem(SITE_THEME_KEY)
        || localStorage.getItem('snakeTheme')
        || localStorage.getItem('pongTheme');
    return normalizeTheme(stored || 'dark');
}

function saveTheme(theme) {
    const normalized = normalizeTheme(theme);
    localStorage.setItem(SITE_THEME_KEY, normalized);
    return normalized;
}

function applyTheme(theme) {
    const normalized = normalizeTheme(theme);
    document.body.className = document.body.className.replace(/theme-[\w]+/g, '');
    if (normalized !== 'dark') {
        document.body.classList.add(`theme-${normalized}`);
    }
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.theme === normalized) {
            opt.classList.add('active');
        }
    });
    return normalized;
}

function initSiteTheme() {
    applyTheme(getSavedTheme());
}

function closeSettingsPanel() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (!settingsPanel) return;
    settingsPanel.classList.remove('open');
    settingsPanel.style.right = '-400px';
    setTimeout(() => {
        settingsPanel.classList.add('hidden');
    }, 400);
}

function initSettingsPanel(settingsBtnId, gameInstance) {
    const settingsBtn = document.getElementById(settingsBtnId);
    const closeBtn = document.getElementById('closeSettings');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeSettingsPanel);
    }

    if (settingsBtn && gameInstance) {
        settingsBtn.addEventListener('click', () => gameInstance.openSettings());
    }

    if (!window.settingsClickHandlerAdded) {
        document.addEventListener('click', (e) => {
            const settingsPanel = document.getElementById('settingsPanel');
            const btn = document.getElementById(settingsBtnId);
            if (!settingsPanel || !btn) return;

            const isSettingsOpen = settingsPanel.classList.contains('open');
            const justOpened = gameInstance && gameInstance.settingsJustOpened;

            if (!justOpened &&
                isSettingsOpen &&
                !settingsPanel.contains(e.target) &&
                !btn.contains(e.target)) {
                closeSettingsPanel();
            }
        });
        window.settingsClickHandlerAdded = true;
    }
}
