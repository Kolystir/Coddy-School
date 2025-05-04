$(document).ready(function () {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const userId = parseInt(localStorage.getItem("userId"));
    const role = localStorage.getItem("role");

    let schedulesMap = {};
    let editingHomeworkId = null;
    let allHomeworks = [];
    let groups = {};

    // Загрузка последовательностей
    loadSchedules()
        .then(() => loadGroups())
        .then(() => loadHomeworks());

    function loadSchedules() {
        return $.ajax({
            url: "http://mature-nissy-kolystir-dbf3058a.koyeb.app:8000/schedules",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
            success: function(data) {
                data.forEach(s => schedulesMap[s.schedule_id] = s);
            },
            error: function() {
                showMessage('Ошибка при загрузке расписаний', 'danger');
            }
        });
    }

    // Загрузка групп для фильтра
    function loadGroups() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "http://mature-nissy-kolystir-dbf3058a.koyeb.app:8000/groups/info",
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` },
                success: function(data) {
                    let filtered = data;
                    if (role === "Преподаватель") {
                        filtered = data.filter(g => g.teacher?.user_id === userId);
                    }
                    groups = filtered.reduce((acc, g) => {
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

    // Заполнить фильтр по группам
    function fillGroupFilter() {
        const $sel = $('#groupFilter');
        $sel.empty().append('<option value="">Все группы</option>');
        Object.entries(groups).forEach(([id, name]) => {
            $sel.append(`<option value="${id}">${name}</option>`);
        });
    }

    function loadHomeworks() {
        $.ajax({
            url: "http://mature-nissy-kolystir-dbf3058a.koyeb.app:8000/homeworks",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
            success: function(homeworks) {
                // Фильтрация по группам
                if (role === "Преподаватель") {
                    const myGroupIds = Object.keys(groups).map(id => parseInt(id));
                    allHomeworks = homeworks.filter(hw => {
                        const sched = schedulesMap[hw.schedule_id];
                        return sched && myGroupIds.includes(sched.group.group_id);
                    });
                } else {
                    allHomeworks = homeworks;
                }
                renderHomeworkList(allHomeworks);
            },
            error: function() {
                showMessage('Ошибка при загрузке домашних заданий', 'danger');
            }
        });
    }

    function getDaysAgoString(diff) {
        if (diff === 0) return 'сегодня';
        if (diff === 1) return '1 день назад';
        const rem10 = diff % 10;
        const rem100 = diff % 100;
        if (rem10 >= 2 && rem10 <= 4 && !(rem100 >= 12 && rem100 <= 14)) return diff + ' дня назад';
        return diff + ' дней назад';
    }

    function renderHomeworkList(homeworks) {
        const html = `
            <div class="container mt-5 pt-5">
                <h2 class="text-center mb-4 mainh1">Список домашних заданий</h2>
                <div id="homeworkMsg" class="text-center mb-3" style="display:none;"></div>
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
                <ul class="list-group" id="homeworkList"></ul>
                <!-- Модалки редактирования/удаления -->
                <div class="modal fade" id="editHomeworkModal" tabindex="-1" aria-labelledby="editHomeworkModalLabel" aria-hidden="true">
                    <div class="modal-dialog"><div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="editHomeworkModalLabel">Редактировать домашнее задание</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editHomeworkForm">
                                <div class="mb-3">
                                    <label for="homeworkDescription" class="form-label">Описание</label>
                                    <textarea class="form-control" id="homeworkDescription" rows="4" required></textarea>
                                </div>
                                <button type="submit" class="btn btn-coddy w-100">Сохранить изменения</button>
                            </form>
                        </div>
                    </div></div>
                </div>
                <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
                    <div class="modal-dialog"><div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Подтвердите удаление</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body"><p>Вы уверены, что хотите удалить это домашнее задание?</p></div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Удалить</button>
                        </div>
                    </div></div>
                </div>
            </div>
        `;
        $("#app").html(html);
        fillGroupFilter();
        renderHomeworkItems(homeworks);
    }

    function renderHomeworkItems(homeworks) {
        const today = new Date();
        const upcoming = [], past = [];
        homeworks.forEach(hw => {
            const sched = schedulesMap[hw.schedule_id];
            if (!sched) return;
            const hwDate = new Date(sched.date);
            (hwDate >= today ? upcoming : past).push(hw);
        });
        const sorted = [...upcoming, ...past];
        const items = sorted.map(hw => {
            const sched = schedulesMap[hw.schedule_id] || {};
            const group = sched.group || {};
            const diffDays = Math.floor((new Date() - new Date(sched.date)) / (1000 * 60 * 60 * 24));
            const ago = getDaysAgoString(diffDays);
            return `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <div><strong>Группа:</strong> ${group.group_name || '—'}</div>
                        <div><strong>Дата занятия:</strong> ${sched.date || '—'} (${ago})</div>
                        <div><strong>ДЗ:</strong> ${hw.description || 'Без описания'}</div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-coddy rounded-circle p-2 d-flex align-items-center justify-content-center editHomework" 
                                data-id="${hw.homework_id}" 
                                data-description="${hw.description || ''}" 
                                style="width: 40px; height: 40px;">
                            <i class="bi bi-pencil" style="font-size: 1.2rem;"></i>
                        </button>
                        <button class="btn btn-danger rounded-circle p-2 d-flex align-items-center justify-content-center deleteHomework" 
                                data-id="${hw.homework_id}" 
                                style="width: 40px; height: 40px;">
                            <i class="bi bi-trash" style="font-size: 1.2rem;"></i>
                        </button>

                    </div>
                </li>`;
        }).join('');
        $("#homeworkList").html(items);
    }

    // Обработчики
    let homeworkToDeleteId = null;
    $(document).on('click', '.deleteHomework', function() {
        homeworkToDeleteId = $(this).data('id');
        new bootstrap.Modal($('#deleteConfirmModal')).show();
    });
    $(document).on('click', '#confirmDeleteBtn', function() {
        if (!homeworkToDeleteId) return;
        $.ajax({ url: `http://mature-nissy-kolystir-dbf3058a.koyeb.app:8000/homeworks/${homeworkToDeleteId}`, method: 'DELETE', headers: { "Authorization": `Bearer ${token}` }, success: function() { showMessage('Домашнее задание удалено','success'); loadHomeworks(); }, error: function() { showMessage('Ошибка при удалении','danger'); }, complete: function() { bootstrap.Modal.getInstance($('#deleteConfirmModal')).hide(); }});
    });
    $(document).on('click', '.editHomework', function() { editingHomeworkId = $(this).data('id'); $('#homeworkDescription').val($(this).data('description')); new bootstrap.Modal($('#editHomeworkModal')).show(); });
    $(document).on('submit', '#editHomeworkForm', function(e) {
        e.preventDefault(); const newDesc = $('#homeworkDescription').val(); if (!editingHomeworkId) return;
        $.ajax({ url: `http://mature-nissy-kolystir-dbf3058a.koyeb.app:8000/homeworks/${editingHomeworkId}`, method: 'PUT', headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, data: JSON.stringify({ description: newDesc }), success: function() { showMessage('Домашнее задание обновлено','success'); bootstrap.Modal.getInstance($('#editHomeworkModal')).hide(); loadHomeworks(); }, error: function() { showMessage('Ошибка при обновлении','danger'); }});
    });
    $(document).on('change', '#dateFilter, #groupFilter', function() {
        const date = $('#dateFilter').val(); const grp = $('#groupFilter').val();
        const filtered = allHomeworks.filter(hw => {
            const sched = schedulesMap[hw.schedule_id]; if (!sched) return false;
            const matchDate = date ? sched.date === date : true;
            const matchGroup = grp ? String(sched.group.group_id) === grp : true;
            return matchDate && matchGroup;
        }); renderHomeworkItems(filtered);
    });
    $(document).on('click', '#resetFilter', function() { $('#dateFilter').val(''); $('#groupFilter').val(''); renderHomeworkItems(allHomeworks); });

    function showMessage(text, type) {
        const msg = $('#homeworkMsg');
        msg.removeClass('text-success text-danger').addClass(type==='success'?'text-success':'text-danger');
        msg.text(text).show(); setTimeout(()=>msg.fadeOut(),5000);
    }
});
