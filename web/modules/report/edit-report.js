$(document).ready(function () {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const userId = parseInt(localStorage.getItem("userId"));
    const role = localStorage.getItem("role");

    let schedulesMap = {};
    let editingReportId = null;
    let allReports = [];
    let groups = {};

    // Сначала загружаем расписания, затем группы, затем отчёты
    loadSchedules()
        .then(() => loadGroups())
        .then(() => loadReports());

    // Загрузка расписаний
    function loadSchedules() {
        return $.ajax({
            url: "http://localhost:8000/schedules",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
            success: function(data) {
                data.forEach(s => {
                    schedulesMap[s.schedule_id] = s;
                });
            },
            error: function() {
                showMessage('Ошибка при загрузке расписаний', 'danger');
            }
        });
    }

    // Загрузка групп с фильтрацией для преподавателя / администратора
    function loadGroups() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "http://localhost:8000/groups/info",
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` },
                success: function(data) {
                    let filteredGroups = data;
                    if (role === "Преподаватель") {
                        filteredGroups = data.filter(g => g.teacher && g.teacher.user_id === userId);
                    }
                    groups = filteredGroups.reduce((acc, g) => {
                        acc[g.group_id] = g.group_name;
                        return acc;
                    }, {});
                    resolve();
                },
                error: function() {
                    showMessage('Ошибка при загрузке групп', 'danger');
                    reject();
                }
            });
        });
    }

    // Функция заполнения селекта группами
    function fillGroupFilter() {
        const $sel = $('#groupFilter');
        $sel.empty().append('<option value="">Все группы</option>');
        Object.entries(groups).forEach(([id, name]) => {
            $sel.append(`<option value="${id}">${name}</option>`);
        });
    }

    // Загрузка отчётов
    function loadReports() {
        return $.ajax({
            url: "http://localhost:8000/reports",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
            success: function(reports) {
                if (role === "Преподаватель") {
                    // Фильтруем отчёты по группам преподавателя
                    const teacherGroupIds = Object.keys(groups).map(id => parseInt(id));
                    allReports = reports.filter(rp => {
                        const sched = schedulesMap[rp.schedule_id];
                        return sched && teacherGroupIds.includes(sched.group.group_id);
                    });
                } else {
                    allReports = reports;
                }
                renderReportList(allReports);
            },
            error: function() {
                showMessage('Ошибка при загрузке отчётов', 'danger');
            }
        });
    }

    // Утилиты для рендера
    function getDaysAgoString(diff) {
        if (diff === 0) return 'сегодня';
        if (diff === 1) return '1 день назад';
        const rem10 = diff % 10;
        const rem100 = diff % 100;
        if (rem10 >= 2 && rem10 <= 4 && !(rem100 >= 12 && rem100 <= 14)) return diff + ' дня назад';
        return diff + ' дней назад';
    }

    function renderReportList(reports) {
        const html = `
            <div class="container mt-5 pt-5">
                <h2 class="text-center mb-4 mainh1">Список отчётов</h2>
                <div id="reportMsg" class="text-center mb-3" style="display:none;"></div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <label class="form-label">Фильтр по дате</label>
                        <input type="date" class="form-control" id="dateFilter">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Фильтр по группе</label>
                        <select class="form-select" id="groupFilter"></select>
                    </div>
                </div>
                <div class="mb-4">
                    <button id="resetFilter" class="btn btn-secondary">Показать все</button>
                </div>
                <ul class="list-group" id="reportList"></ul>

                <!-- Модалки -->
                <div class="modal fade" id="editReportModal" tabindex="-1" aria-labelledby="editReportModalLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="editReportModalLabel">Редактировать отчёт</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editReportForm">
                                    <div class="mb-3">
                                        <label for="reportDescription" class="form-label">Описание</label>
                                        <textarea class="form-control" id="reportDescription" rows="4" required></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-coddy w-100">Сохранить изменения</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Подтвердите удаление</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
                            </div>
                            <div class="modal-body">
                                <p>Вы уверены, что хотите удалить этот отчёт?</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Удалить</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $("#app").html(html);
        fillGroupFilter();
        renderReportItems(reports);
    }

    function renderReportItems(reports) {
        const today = new Date();
        const upcoming = [], past = [];

        reports.forEach(rp => {
            const sched = schedulesMap[rp.schedule_id];
            if (!sched) return;
            const lessonDate = new Date(sched.date);
            (lessonDate >= today ? upcoming : past).push(rp);
        });

        const sorted = [...upcoming, ...past];
        const items = sorted.map(rp => {
            const sched = schedulesMap[rp.schedule_id] || {};
            const group = sched.group || {};
            const diffDays = Math.floor((new Date() - new Date(sched.date)) / (1000 * 60 * 60 * 24));
            const ago = getDaysAgoString(diffDays);

            return `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <div><strong>Группа:</strong> ${group.group_name || '—'}</div>
                        <div><strong>Дата занятия:</strong> ${sched.date || '—'} (${ago})</div>
                        <div><strong>Отчёт:</strong> ${rp.description || 'Без описания'}</div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-coddy rounded-circle p-2 d-flex align-items-center justify-content-center editReport" 
                                data-id="${rp.report_id}" 
                                data-description="${rp.description || ''}" 
                                style="width: 40px; height: 40px;">
                            <i class="bi bi-pencil" style="font-size: 1.2rem;"></i>
                        </button>
                        <button class="btn btn-danger rounded-circle p-2 d-flex align-items-center justify-content-center deleteReport" 
                                data-id="${rp.report_id}" 
                                style="width: 40px; height: 40px;">
                            <i class="bi bi-trash" style="font-size: 1.2rem;"></i>
                        </button>
                    </div>
                </li>
            `;
        }).join('');

        $("#reportList").html(items);
    }

    // Обработчики модалок и фильтров
    let reportToDeleteId = null;

    $(document).on('click', '.deleteReport', function() {
        reportToDeleteId = $(this).data('id');
        new bootstrap.Modal($('#deleteConfirmModal')).show();
    });

    $(document).on('click', '#confirmDeleteBtn', function() {
        if (!reportToDeleteId) return;
        $.ajax({
            url: `http://localhost:8000/reports/${reportToDeleteId}`,
            method: 'DELETE',
            headers: { "Authorization": `Bearer ${token}` },
            success: function() {
                showMessage('Отчёт удалён', 'success');
                loadReports();
            },
            error: function() {
                showMessage('Ошибка при удалении', 'danger');
            },
            complete: function() {
                bootstrap.Modal.getInstance($('#deleteConfirmModal')).hide();
            }
        });
    });

    $(document).on('click', '.editReport', function() {
        editingReportId = $(this).data('id');
        $('#reportDescription').val($(this).data('description'));
        new bootstrap.Modal($('#editReportModal')).show();
    });

    $(document).on('submit', '#editReportForm', function(e) {
        e.preventDefault();
        const newDesc = $('#reportDescription').val();
        if (!editingReportId) return;
        $.ajax({
            url: `http://localhost:8000/reports/${editingReportId}`,
            method: 'PUT',
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            data: JSON.stringify({ description: newDesc }),
            success: function() {
                showMessage('Отчёт обновлён', 'success');
                bootstrap.Modal.getInstance($('#editReportModal')).hide();
                loadReports();
            },
            error: function() {
                showMessage('Ошибка при обновлении', 'danger');
            }
        });
    });

    $(document).on('change', '#dateFilter, #groupFilter', function () {
        const date = $('#dateFilter').val();
        const grp = $('#groupFilter').val();
        const filtered = allReports.filter(rp => {
            const sched = schedulesMap[rp.schedule_id];
            if (!sched) return false;
            const matchDate = date ? sched.date === date : true;
            const matchGroup = grp ? String(sched.group.group_id) === grp : true;
            return matchDate && matchGroup;
        });
        renderReportItems(filtered);
    });

    $(document).on('click', '#resetFilter', function() {
        $('#dateFilter').val('');
        $('#groupFilter').val('');
        renderReportItems(allReports);
    });

    function showMessage(text, type) {
        const msg = $('#reportMsg');
        msg.removeClass('text-success text-danger').addClass(type === 'success' ? 'text-success' : 'text-danger');
        msg.text(text).show();
        setTimeout(() => msg.fadeOut(), 5000);
    }
});






