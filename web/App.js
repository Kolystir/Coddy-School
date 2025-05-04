$(document).ready(function () {
    // Базовый путь для всех ресурсов
    const BASE_PATH = 'web/';

    // Объект для отслеживания загруженных скриптов
    const loadedScripts = {};

    // Загрузка скрипта (один раз)
    function loadScript(path, key) {
        const fullPath = BASE_PATH + path;
        return new Promise((resolve, reject) => {
            if (!loadedScripts[key]) {
                $.getScript(fullPath)
                    .done(() => {
                        loadedScripts[key] = true;
                        console.log(`✅ Script loaded: ${fullPath}`);
                        resolve();
                    })
                    .fail((jqxhr, settings, exception) => {
                        console.error(`❌ Failed to load: ${fullPath}`, exception);
                        reject(exception);
                    });
            } else {
                resolve(); // уже загружен
            }
        });
    }

    // Универсальный загрузчик и инициализатор модуля
    function loadAndInitModule(modulePath) {
        const moduleKey = modulePath.replace(/\//g, '_').replace(/\./g, '_');

        function initCurrentModule() {
            // Можно очищать старый контент, если нужно:
            if ($('#content').length) {
                $('#content').empty();
            }

            const initFn = window['init_' + moduleKey];
            if (typeof initFn === 'function') {
                console.log(`🚀 Инициализация модуля: init_${moduleKey}`);
                initFn();
            } else {
                console.warn(`⚠️ Нет функции инициализации для модуля: init_${moduleKey}`);
            }
        }

        // Загрузка и инициализация
        if (loadedScripts[moduleKey]) {
            initCurrentModule(); // модуль уже загружен — просто инициализируем
        } else {
            loadScript(modulePath, moduleKey)
                .then(() => initCurrentModule())
                .catch(err => console.error(`Ошибка при загрузке модуля: ${modulePath}`, err));
        }
    }

    // Загрузка базовых скриптов
    Promise.all([
        loadScript('modules/layout/Navbar.js', 'navbar'),
        loadScript('modules/layout/footer.js', 'footer'),
        loadScript('Web-main.js', 'webMain'),
        loadScript('utils/auth.js', 'auth'),
        loadScript('modules/settings/settings.js', 'settings')
    ]).catch(error => {
        console.error("Critical initialization error:", error);
    });

    // === Обработчики кнопок ===
    $(document).on("click", "#add-user", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/users/add-user.js");
    });

    $(document).on("click", "#edit-user", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/users/edit-user.js");
    });

    $(document).on("click", "#add-course", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/courses/add-course.js");
    });

    $(document).on("click", "#edit-course", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/courses/edit-course.js");
    });

    $(document).on("click", "#group", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/groups/group.js");
    });

    $(document).on("click", "#group-add", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/groups/add-group.js");
    });

    $(document).on("click", "#edit-group", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/groups/edit-group.js");
    });

    $(document).on("click", "#schedule", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/schedule/schedule.js");
    });

    $(document).on("click", "#add-schedule", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/schedule/schedule-add.js");
    });

    $(document).on("click", "#edit-schedule", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/schedule/schedule-edit.js");
    });
    $(document).on("click", "#add-report", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/report/add-report.js");
    });
    $(document).on("click", "#add-homework", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/homework/add-homework.js");
    });
    $(document).on("click", "#edit-homework", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/homework/edit-homework.js");
    });
    $(document).on("click", "#edit-report", function (e) {
        e.preventDefault();
        loadAndInitModule("modules/report/edit-report.js");
    });

    // Очистка при переходах (если нужно)
    $(document).on('beforeNavigate', function () {
        Object.keys(loadedScripts).forEach(scriptKey => {
            if (typeof window[`cleanup_${scriptKey}`] === 'function') {
                window[`cleanup_${scriptKey}`]();
                console.log(`🧹 Cleanup выполнен для: ${scriptKey}`);
            }
        });
    });
});
