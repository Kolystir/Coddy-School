function _init() {    
    $(document).ready(function () {
        const API_BASE = "https://mature-nissy-kolystir-dbf3058a.koyeb.app";
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const userId = parseInt(localStorage.getItem("userId"));
        const role = localStorage.getItem("role");

        let allGroups = [];
        let allSchedules = [];
        let editingSchedule = null;
        let scheduleToDelete = null;

        // Загрузка групп и расписаний
        loadGroups()
            .then(loadScheduleList)
            .catch(() => showMessage('Ошибка при загрузке групп','danger'));

        function loadGroups() {
            return $.ajax({
                url: `${API_BASE}/groups/info`,
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            }).then(data => {
                allGroups = (role === 'Преподаватель')
                    ? data.filter(g => g.teacher?.user_id === userId)
                    : data;
            });
        }

        function loadScheduleList() {
            return $.ajax({
                url: `${API_BASE}/schedules`,
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            }).then(schedules => {
                allSchedules = (role === 'Преподаватель')
                    ? schedules.filter(s => allGroups.some(g => g.group_id === s.group.group_id))
                    : schedules;
                renderScheduleList(allSchedules);
            }).catch(() => showMessage('Ошибка при загрузке расписаний','danger'));
        }

        function renderScheduleList(schedules) {
            const groupOptions = allGroups.map(g => `<option value="${g.group_id}">${g.group_name}</option>`).join('');
            const html = `
                <div class="container mt-5 pt-5">
                    <h2 class="text-center mb-4 mainh1">Управление расписанием</h2>
                    <div id="scheduleMsg" class="text-center mb-3" style="display:none;"></div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Фильтр по дате</label>
                            <input type="date" id="dateFilter" class="form-control">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Фильтр по группе</label>
                            <select id="groupFilter" class="form-select">
                                <option value="">Все группы</option>
                                ${groupOptions}
                            </select>
                        </div>
                    </div>
                    <div class="mb-4">
                        <button id="resetFilter" class="btn btn-secondary">Показать все</button>
                    </div>
                    <div id="scheduleContainer" class="row">
                        ${generateScheduleCards(schedules)}
                    </div>
                </div>

                <!-- Модальное окно подтверждения удаления -->
                <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Подтвердите удаление</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                    </div>
                    <div class="modal-body">
                        <p>Вы уверены, что хотите удалить это расписание?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Удалить</button>
                    </div>
                    </div>
                </div>
                </div>
            `;
            $("#app").html(html);
        }

        function generateScheduleCards(schedules) {
            if (!schedules.length) {
                return `<div class="col-12 text-center">Расписание не найдено.</div>`;
            }
            return schedules.map(schedule => `
                <div class="col-md-4 mb-4">
                    <div class="card shadow-sm h-100">
                        <div class="card-body d-flex flex-column justify-content-between">
                            <div>
                                <h5 class="card-title">${schedule.group.group_name}</h5>
                                <p class="card-text">Дата: ${formatDate(schedule.date)}<br>Время: ${schedule.start_time} - ${schedule.end_time}</p>
                            </div>
                            <div class="d-flex gap-2 justify-content-end">
                                <button class="btn btn-coddy rounded-circle p-2 editScheduleButton" data-schedule-id="${schedule.schedule_id}" style="width:40px; height:40px;">
                                    <i class="bi bi-pencil" style="font-size:1.2rem;"></i>
                                </button>
                                <button class="btn btn-danger rounded-circle p-2 deleteScheduleButton" data-schedule-id="${schedule.schedule_id}" style="width:40px; height:40px;">
                                    <i class="bi bi-trash" style="font-size:1.2rem;"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function getWeekday(dateString) {
            const days = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
            return days[new Date(dateString).getDay()];
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            const options = { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };
            return date.toLocaleDateString('ru-RU', options);
        }


        // Слушатели
        $(document).on('change', '#dateFilter, #groupFilter', applyFilters);
        $(document).on('click', '#resetFilter', function() {
            $('#dateFilter').val('');
            $('#groupFilter').val('');
            applyFilters();
        });

        $(document).on('click', '.editScheduleButton', function () {
            const scheduleId = $(this).data("schedule-id");
            editingSchedule = allSchedules.find(s => s.schedule_id === scheduleId);
            if (!editingSchedule) return showMessage('Расписание не найдено','danger');
            renderEditForm(editingSchedule);
        });

        $(document).on('click', '.deleteScheduleButton', function() {
            scheduleToDelete = $(this).data('schedule-id');
            const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
            modal.show();
        });

        $(document).on('click', '#confirmDeleteBtn', function() {
            if (!scheduleToDelete) return;
            $.ajax({
                url: `${API_BASE}/schedules/${scheduleToDelete}`,
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` },
                success: function() {
                    showMessage('Расписание удалено','success');
                    loadScheduleList();
                },
                error: function(xhr) {
                    showMessage('Ошибка при удалении: '+(xhr.responseJSON?.detail||xhr.responseText),'danger');
                },
                complete: function() {
                    bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
                }
            });
        });

        function applyFilters() {
            const date = $('#dateFilter').val();
            const grp = $('#groupFilter').val();
            const filtered = allSchedules.filter(s => {
                const matchDate = date ? s.date === date : true;
                const matchGroup = grp ? String(s.group.group_id) === grp : true;
                return matchDate && matchGroup;
            });
            $('#scheduleContainer').html(generateScheduleCards(filtered));
        }

        function renderEditForm(schedule) {
            const options = allGroups.map(g => `<option value="${g.group_id}"${g.group_id===schedule.group.group_id?' selected':''}>${g.group_name}</option>`).join('');
            $("#app").html(`
                <div class="container mt-5 pt-5">
                    <button id="backToList" class="btn btn-secondary mb-4">Назад к расписанию</button>
                    <h2 class="text-center mb-5 mainh1">Редактировать расписание</h2>
                    <div id="scheduleMsg" class="text-center mb-3" style="display:none;"></div>
                    <form id="editScheduleForm" class="shadow p-4 rounded bg-light">
                        <div class="mb-3">
                            <label class="form-label">Дата</label>
                            <input type="date" class="form-control" id="date" required value="${schedule.date}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Время начала</label>
                            <input type="time" class="form-control" id="startTime" required value="${schedule.start_time}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Время окончания</label>
                            <input type="time" class="form-control" id="endTime" required value="${schedule.end_time}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Группа</label>
                            <select class="form-select" id="groupId">${options}</select>
                        </div>
                        <button type="submit" class="btn btn-coddy btn-lg w-100">Сохранить</button>
                    </form>
                </div>
            `);

            // авто-заполнение конца +2 часа
            $('#startTime').on('input', function() {
                const start = $(this).val(); if (!start) return;
                const [h,m] = start.split(':').map(Number);
                let endH = h + 2; if (endH >= 24) endH -= 24;
                $('#endTime').val(`${String(endH).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
            });

            $('#backToList').on('click', loadScheduleList);
            $('#editScheduleForm').on('submit', function(e) {
                e.preventDefault();
                const payload = {
                    date: $('#date').val(),
                    start_time: $('#startTime').val(),
                    end_time: $('#endTime').val(),
                    group_id: parseInt($('#groupId').val(),10)
                };
                $.ajax({
                    url: `${API_BASE}/schedules/${schedule.schedule_id}`,
                    method: 'PUT',
                    headers: { "Authorization": `Bearer ${token}` },
                    contentType: 'application/json',
                    data: JSON.stringify(payload),
                    success: function() {
                        showMessage('Расписание успешно обновлено','success');
                        setTimeout(loadScheduleList, 500);
                    },
                    error: function(xhr) {
                        showMessage('Ошибка при обновлении: '+(xhr.responseJSON?.detail||xhr.responseText),'danger');
                    }
                });
            });
        }

        function showMessage(text, type) {
            const msg = $('#scheduleMsg');
            msg.removeClass('text-success text-danger').addClass(type==='success'?'text-success':'text-danger');
            msg.text(text).show();
            setTimeout(() => msg.fadeOut(), 5000);
        }
    });
}
window['init_modules_schedule_schedule-edit_js'] = _init;