$(document).ready(function() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const userId = parseInt(localStorage.getItem("userId"));
    const role = localStorage.getItem("role");

    // Загрузка групп и расписаний
    let allGroups = [];
    let allSchedules = [];

    function loadGroups() {
        return $.ajax({
            url: "http://localhost:8000/groups/info",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
    }

    function loadSchedules() {
        return $.ajax({
            url: "http://localhost:8000/schedules",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
    }

    // Отрисовка интерфейса
    function renderInterface(groups) {
        // фильтрация групп по роли
        let filtered = groups;
        if (role === "Преподаватель") {
            filtered = groups.filter(g => g.teacher?.user_id === userId);
        }

        allGroups = filtered;
        const options = filtered.map(g => `<option value="${g.group_id}">${g.group_name}</option>`).join('');
        $('#app').html(`
            <div class="container mt-5 pt-5">
                <h2 class="text-center mb-4 mainh1">Управление расписанием</h2>
                <div id="scheduleMsg" class="text-center mb-3" style="display:none;"></div>
                <form id="addScheduleForm" class="shadow p-4 rounded bg-light">
                    <div class="row">
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Дата занятия</label>
                            <input type="date" class="form-control" id="scheduleDate" required>
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Начало занятия</label>
                            <input type="time" class="form-control" id="startTime" required>
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Окончание занятия</label>
                            <input type="time" class="form-control" id="endTime" required>
                        </div>
                        <div class="col-md-3 mb-3">
                            <label class="form-label">Группа</label>
                            <select class="form-select" id="groupSelect" required>
                                <option value="">Выберите группу</option>
                                ${options}
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-coddy btn-lg w-100">Создать расписание</button>
                </form>

                <div class="mt-5">
                    <div class="mb-3">
                        <label for="groupFilter" class="form-label">Фильтр по группе</label>
                        <select id="groupFilter" class="form-select">
                            <option value="">Все группы</option>
                            ${options}
                        </select>
                    </div>
                    <table class="table table-striped" id="schedulesTable">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Начало</th>
                                <th>Окончание</th>
                                <th>Группа</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        `);

        bindEvents();
        refreshSchedules();
    }

    // Биндинг событий
    function bindEvents() {
        // Авто-заполнение времени окончания +2 часа
        $(document).off('input', '#startTime').on('input', '#startTime', function() {
            const start = $(this).val();
            if (!start) return;
            const [h, m] = start.split(':').map(Number);
            let endH = h + 2;
            if (endH >= 24) endH -= 24;
            const hh = String(endH).padStart(2, '0');
            const mm = String(m).padStart(2, '0');
            $('#endTime').val(`${hh}:${mm}`);
        });

        // Добавление расписания
        $("#addScheduleForm").off('submit').on('submit', function(e) {
            e.preventDefault();
            const payload = {
                date: $('#scheduleDate').val(),
                start_time: $('#startTime').val(),
                end_time: $('#endTime').val(),
                group_id: parseInt($('#groupSelect').val(), 10)
            };
            $.ajax({
                url: "http://localhost:8000/schedules",
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                data: JSON.stringify(payload),
                contentType: "application/json",
                success: function() {
                    showMessage('Расписание успешно создано', 'success');
                    $('#addScheduleForm')[0].reset();
                    refreshSchedules();
                },
                error: function(xhr) {
                    const text = xhr.responseJSON?.detail || xhr.responseText || 'Ошибка при создании расписания';
                    showMessage(text, 'danger');
                }
            });
        });

        // Фильтр расписаний по группе
        $('#app').off('change', '#groupFilter').on('change', '#groupFilter', function() {
            filterSchedules($(this).val());
        });
    }

    // Показ сообщения
    function showMessage(text, type) {
        const msg = $('#scheduleMsg');
        msg.removeClass('text-success text-danger').addClass(type === 'success' ? 'text-success' : 'text-danger');
        msg.text(text).show();
        setTimeout(() => { msg.fadeOut(); }, 5000);
    }

    // Обновление и фильтрация расписаний
    function refreshSchedules() {
        loadSchedules().done(function(data) {
            // при фильрации уже используется allGroups, расписание выбираем по нему
            allSchedules = data;
            renderSchedules(data);
        });
    }

    function renderSchedules(list) {
        const tbody = $('#schedulesTable tbody').empty();
        if (!list.length) {
            tbody.append('<tr><td colspan="4" class="text-center">Нет расписаний</td></tr>');
            return;
        }
        list.forEach(item => {
            // только расписания по доступным группам
            if (role === "Преподаватель" && !allGroups.some(g => g.group_id === item.group.group_id)) return;
            tbody.append(
                `<tr>
                    <td>${item.date}</td>
                    <td>${item.start_time}</td>
                    <td>${item.end_time}</td>
                    <td>${item.group.group_name}</td>
                </tr>`
            );
        });
    }

    function filterSchedules(groupId) {
        if (!groupId) {
            renderSchedules(allSchedules);
        } else {
            const filtered = allSchedules.filter(s => s.group.group_id == groupId);
            renderSchedules(filtered);
        }
    }

    // Инициализация
    $.when(loadGroups()).done(function(groups) {
        renderInterface(groups);
    }).fail(function() {
        alert('Ошибка при загрузке групп');
    });
});
