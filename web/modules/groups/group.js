$(document).ready(function() {
    var token = localStorage.getItem("token");
    if (!token) {
        alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
        window.location.href = '/login';
        return;
    }
    
    loadGroups();
    
    // Функция для загрузки информации о группах
    function loadGroups() {
        $.ajax({
            url: `${API_BASE}/groups/info`,
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
            success: function(groups) {
                renderGroups(groups);
            },
            error: function() {
                alert("Ошибка при загрузке групп");
            }
        });
    }
    
    // Функция отображения групп
    function renderGroups(groups) {
        let html = `
            <div class="container mt-5 pt-5">
                <h2 class="text-center mb-5 mainh1">Группы</h2>
                <div class="row">
                    ${groups.map(group => renderGroupCard(group)).join('')}
                </div>
            </div>
        `;
        $("#app").html(html);
    }
    
    // Функция генерации карточки для одной группы
    function renderGroupCard(group) {
        let teacherHTML = group.teacher ? `
            <p><strong>Классный руководитель:</strong> ${group.teacher.first_name} ${group.teacher.last_name}</p>
        ` : `<p><strong>Классный руководитель:</strong> не назначен</p>`;
        
        let studentsHTML = "";
        if (group.students.length > 0) {
            studentsHTML = `<ul>${group.students.map(student => `<li>${student.first_name} ${student.last_name}</li>`).join('')}</ul>`;
        } else {
            studentsHTML = "<p>Ученики отсутствуют</p>";
        }
        
        return `
            <div class="col-md-4 mb-4">
                <div class="card shadow-sm h-100">
                    <div class="card-body">
                        <h5 class="card-title">${group.group_name}</h5>
                        ${teacherHTML}
                        <h6>Ученики:</h6>
                        ${studentsHTML}
                    </div>
                </div>
            </div>
        `;
    }
});
