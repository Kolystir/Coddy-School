$(document).ready(function () {
    // 1) Вставляем HTML модалки
    const settingsModalHtml = `
      <div class="modal fade" id="settingsModal" tabindex="-1" aria-labelledby="settingsModalLabel" aria-hidden="true">
        <div class="modal-dialog" style="max-width:400px; margin:8vh auto 0;">
          <div class="modal-content p-4 rounded shadow-lg">
            <div class="modal-header border-0 justify-content-center position-relative pb-0">
              <h5 class="modal-title" id="settingsModalLabel">Настройки профиля</h5>
              <button type="button" class="btn-close position-absolute end-0 top-0 m-3" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body pt-2">
              <form id="settingsForm">
                <div class="mb-3">
                  <label class="form-label">Имя пользователя</label>
                  <input type="text" class="form-control" id="setUsername" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Имя</label>
                  <input type="text" class="form-control" id="setFirstName">
                </div>
                <div class="mb-3">
                  <label class="form-label">Фамилия</label>
                  <input type="text" class="form-control" id="setLastName">
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" id="setEmail">
                </div>
                <div class="mb-3">
                  <label class="form-label">Новый пароль</label>
                  <input type="password" class="form-control" id="setPassword" placeholder="Оставьте пустым, если не менять">
                </div>
                <!-- Здесь будут и ошибки, и успех -->
                <div id="settingsMsg" class="text-center mb-3" style="display:none;"></div>
              </form>
            </div>
            <div class="modal-footer border-0 justify-content-center pt-0">
              <button type="button" class="btn btn-coddy px-5" id="settingsSubmit">Сохранить</button>
            </div>
          </div>
        </div>
      </div>`;
    $("body").append(settingsModalHtml);
  
    // 2) Открытие модалки по клику
    $(document).on("click", "#user-settings", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) {
        // если не вошли — переводим на страницу логина
        window.location.href = "/login";
        return;
      }
      // Забираем текущие данные пользователя
      $.ajax({
        url: `http://localhost:8000/users-edit/${userId}`,
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
        success: function (data) {
          $("#setUsername").val(data.username);
          $("#setFirstName").val(data.first_name);
          $("#setLastName").val(data.last_name);
          $("#setEmail").val(data.email || "");
          // очистим сообщения
          $("#settingsMsg").hide().removeClass("text-danger text-success").text("");
          $("#settingsModal").modal("show");
        },
        error: function () {
          // покажем ошибку прямо в модалке
          $("#settingsMsg")
            .addClass("text-danger")
            .text("Не удалось загрузить настройки")
            .show();
          $("#settingsModal").modal("show");
        }
      });
    });
  
    // 3) Сохранение изменений
    $(document).on("click", "#settingsSubmit", function () {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const payload = {
        username: $("#setUsername").val(),
        first_name: $("#setFirstName").val(),
        last_name: $("#setLastName").val(),
        email: $("#setEmail").val(),
      };
      const pw = $("#setPassword").val();
      if (pw) payload.password = pw;
  
      $.ajax({
        url: "http://localhost:8000/users/me",
        method: "PUT",
        contentType: "application/json",
        headers: { "Authorization": `Bearer ${token}` },
        data: JSON.stringify(payload),
        success: function () {
          $("#settingsMsg")
            .removeClass("text-danger")
            .addClass("text-success")
            .text("Настройки успешно сохранены")
            .show();
          // через секунду скрываем модалку и перезагружаем
          setTimeout(() => {
            $("#settingsModal").modal("hide");
            location.reload();
          }, 1000);
        },
        error: function (xhr) {
          const err = xhr.responseJSON?.detail || "Ошибка при сохранении";
          $("#settingsMsg")
            .removeClass("text-success")
            .addClass("text-danger")
            .text(err)
            .show();
        }
      });
    });
  });
  