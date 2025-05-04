$(document).ready(function () {
  var token = localStorage.getItem("token");
  if (!token) {
    alert("Вы не авторизованы. Пожалуйста, войдите в систему.");
    window.location.href = '/login';
    return;
  }

  loadUserList();

  function loadUserList() {
    $.ajax({
      url: "http://mature-nissy-kolystir-dbf3058a.koyeb.app:8000/users",
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
      success: function (users) {
        window.allUsers = users;
        renderUserList(users);
      },
      error: function () {
        showModal("Ошибка при загрузке пользователей");
      }
    });
  }

  function renderUserList(users) {
    let html = `
      <div class="container mt-5 pt-5">
        <h2 class="text-center mb-5 mainh1">Выберите пользователя для редактирования</h2>
        <div class="row mb-4">
          <div class="col-md-4">
            <input type="text" id="searchName" class="form-control" placeholder="Поиск по имени или логину">
          </div>
          <div class="col-md-4">
            <select id="filterRole" class="form-select">
              <option value="">Все роли</option>
              <option value="Ученик">Ученик</option>
              <option value="Родитель">Родитель</option>
              <option value="Преподаватель">Преподаватель</option>
              <option value="Админ">Админ</option>
            </select>
          </div>
          <div class="col-md-4">
            <button id="clearFilters" class="btn btn-secondary">Сбросить фильтры</button>
          </div>
        </div>
        <div id="usersContainer" class="row">
          ${generateUserCards(users)}
        </div>
      </div>
      ${modalTemplate()}
    `;
    $("#app").html(html);
    $("#searchName").on("input", filterUsers);
    $("#filterRole").on("change", filterUsers);
    $("#clearFilters").on("click", function () {
      $("#searchName").val("");
      $("#filterRole").val("");
      filterUsers();
    });
  }

  function generateUserCards(users) {
    if (users.length === 0) {
      return `<div class="col-12"><p>Пользователи не найдены.</p></div>`;
    }
    return users.map(user => `
      <div class="col-md-4 mb-4">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <h5 class="card-title">${user.first_name} ${user.last_name}</h5>
            <p class="card-text">
              Роль: ${user.role}<br>
              Логин: ${user.username}<br>
              Email: ${user.email || 'Нет'}
            </p>
            <div class="d-flex gap-2 justify-content-end">
              <button class="btn btn-coddy rounded-circle editUserButton" data-user-id="${user.user_id}" style="width:40px;height:40px;padding: 0px 0px;">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-danger rounded-circle deleteUserButton" data-user-id="${user.user_id}" style="width:40px;height:40px;">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function filterUsers() {
    let searchTerm = $("#searchName").val().toLowerCase();
    let filterRole = $("#filterRole").val();
    let filtered = window.allUsers.filter(user => {
      let fullName = (user.first_name + " " + user.last_name).toLowerCase();
      let username = user.username ? user.username.toLowerCase() : "";
      let matchesName = fullName.includes(searchTerm) || username.includes(searchTerm);
      let matchesRole = filterRole === "" || user.role === filterRole;
      return matchesName && matchesRole;
    });
    $("#usersContainer").html(generateUserCards(filtered));
  }

  $(document).on("click", ".editUserButton", function () {
    const userId = $(this).data("user-id");
    loadEditForm(userId);
  });

  $(document).on("click", ".deleteUserButton", function () {
    const userId = $(this).data("user-id");
    showConfirmModal("Вы действительно хотите удалить пользователя?", function () {
      $.ajax({
        url: `http://mature-nissy-kolystir-dbf3058a.koyeb.app:8000/delete-user/${userId}`,
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
        success: function () {
          loadUserList();
          showSuccessToast("Пользователь успешно удалён!");
        },        
        error: function (xhr) {
          showModal("Ошибка при удалении пользователя: " + (xhr.responseJSON?.detail || "Неизвестная ошибка"));
        }
      });
    });
  });

  function loadEditForm(userId) {
    $.ajax({
      url: `http://mature-nissy-kolystir-dbf3058a.koyeb.app:8000/users-edit/${userId}`,
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
      success: function (user) {
        renderEditForm(user);
      },
      error: function () {
        showModal("Ошибка при загрузке данных пользователя");
      }
    });
  }

  function renderEditForm(user) {
    $("#app").html(`
      <div class="container mt-5 pt-5">
        <button id="backToList" class="btn btn-secondary mb-4">Назад к выбору пользователя</button>
        <h2 class="text-center mb-5 mainh1">Редактировать пользователя</h2>
        <form id="editUserForm">
          <div class="mb-4">
            <label class="form-label">Имя</label>
            <input type="text" class="form-control" id="firstName" required value="${user.first_name}">
          </div>
          <div class="mb-4">
            <label class="form-label">Фамилия</label>
            <input type="text" class="form-control" id="lastName" required value="${user.last_name}">
          </div>
          <div class="mb-4">
            <label class="form-label">Логин</label>
            <input type="text" class="form-control" id="username" required value="${user.username}">
          </div>
          <div class="mb-4">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" id="email" value="${user.email || ''}">
          </div>
          <div class="mb-4">
            <label class="form-label">Пароль (оставьте пустым, если не меняете)</label>
            <input type="password" class="form-control" id="password">
          </div>
          <div class="mb-4">
            <label class="form-label">Роль</label>
            <select class="form-select" id="role" required>
              <option value="Ученик" ${user.role === "Ученик" ? "selected" : ""}>Ученик</option>
              <option value="Родитель" ${user.role === "Родитель" ? "selected" : ""}>Родитель</option>
              <option value="Преподаватель" ${user.role === "Преподаватель" ? "selected" : ""}>Преподаватель</option>
              <option value="Админ" ${user.role === "Админ" ? "selected" : ""}>Админ</option>
            </select>
          </div>
          <button type="submit" class="btn btn-coddy btn-lg">Сохранить</button>
        </form>
        ${modalTemplate()}
      </div>
    `);

    $("#backToList").on("click", function () {
      loadUserList();
    });

    $("#editUserForm").submit(function (event) {
      event.preventDefault();
      const formData = {
        first_name: $("#firstName").val(),
        last_name: $("#lastName").val(),
        username: $("#username").val(),
        role: $("#role").val()
      };
      
      const email = $("#email").val().trim();
      if (email) {
        formData.email = email;
      }
      
      const password = $("#password").val().trim();
      if (password) {
        formData.password = password;
      }
      $.ajax({
        url: `http://mature-nissy-kolystir-dbf3058a.koyeb.app:8000/users-edit/${user.user_id}`,
        type: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        data: JSON.stringify(formData),
        contentType: "application/json",
        success: function () {
          const modal = new bootstrap.Modal(document.getElementById("infoModal"));
          $('#infoModal .modal-body').text("Пользователь успешно обновлён!");
          modal.show();
          
          setTimeout(() => {
            modal.hide();
            loadUserList();  // Возврат к списку пользователей
          }, 1500);
        },        
        error: function (xhr) {
          showModal("Ошибка при обновлении: " + xhr.responseText);
        }
      });
    });
  }

  function modalTemplate() {
    return `
      <div class="modal fade" id="infoModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered" style="margin-top: -100px;">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Уведомление</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal">ОК</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function showModal(message) {
    const modal = new bootstrap.Modal(document.getElementById('infoModal'));
    $('#infoModal .modal-body').text(message);
    modal.show();
  }

  function showConfirmModal(message, onConfirm) {
    const confirmHtml = `
      <div class="modal fade" id="confirmModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered" style="margin-top: -100px;">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Подтверждение</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
            </div>
            <div class="modal-body">${message}</div>
            <div class="modal-footer">
              <button id="confirmYes" type="button" class="btn btn-danger">Да</button>
            </div>
          </div>
        </div>
      </div>
    `;
    $('body').append(confirmHtml);
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    confirmModal.show();
  
    $("#confirmYes").on("click", function () {
      confirmModal.hide();
      onConfirm();
    });
  
    $('#confirmModal').on('hidden.bs.modal', function () {
      $('#confirmModal').remove();
  
      // 👇 Удаляем затемнение вручную, если оно осталось
      $('.modal-backdrop').remove();
  
      // 👇 Восстанавливаем прокрутку
      $('body').removeClass('modal-open').css('overflow', 'auto');
    });
  }
  
});
