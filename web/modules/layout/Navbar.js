$(document).ready(function () {
  function updateNavbar() {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    const navStart = `
      <nav class="py-3 navbar navbar-expand-lg fixed-top auto-hiding-navbar navbar-light">
        <div class="container">
          <a class="navbar-brand" href="">Coddy - Кострома</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" 
                  data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" 
                  aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav ms-auto">
    `;
    const navEnd = `
            </ul>
          </div>
        </div>
      </nav>
    `;

    let itemsHtml = "";

    if (!token) {
      // Гость
      itemsHtml += `
        <li class="nav-item"><a class="nav-link" href="">Преподаватели</a></li>
        <li class="nav-item"><a class="nav-link" href="">Курсы</a></li>
        <li class="nav-item"><a class="nav-link" href="">Обратная связь</a></li>
        <li class="nav-item"><a class="nav-link" href="" id="authorization-link">Войти</a></li>
      `;
    } else {
      // Общие для всех авторизованных
      if (role === "Родитель" || role === "Ученик") {
        itemsHtml += `
          <li class="nav-item"><a class="nav-link" href="">Преподаватели</a></li>
          <li class="nav-item"><a class="nav-link" href="">Курсы</a></li>
          <li class="nav-item"><a class="nav-link" href="">Обратная связь</a></li>
          <li class="nav-item"><a class="nav-link" href="" id="schedule">Расписание</a></li>
        `;
      } else if (role === "Преподаватель") {
        itemsHtml += `
          <li class="nav-item"><a class="nav-link" href="" id="schedule">Расписание</a></li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="" id="addDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Добавить
            </a>
            <ul class="dropdown-menu" aria-labelledby="addDropdown">
              <li><a class="dropdown-item" href="" id="add-schedule">Расписание</a></li>
              <li><a class="dropdown-item" href="" id="add-report">Отчёта</a></li>
              <li><a class="dropdown-item" href="" id="add-homework">Домашнего задания</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="editDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Редактировать
            </a>
            <ul class="dropdown-menu" aria-labelledby="editDropdown">
              <li><a class="dropdown-item" href="" id="edit-schedule">Расписание</a></li>
              <li><a class="dropdown-item" href="" id="edit-report">Отчёта</a></li>
              <li><a class="dropdown-item" href="" id="edit-homework">Домашнего задания</a></li>
            </ul>
          </li>
        `;
      } else if (role === "Админ") {
        itemsHtml += `
          <li class="nav-item"><a class="nav-link" href="" id="schedule">Расписание</a></li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="" id="addDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Добавить
            </a>
            <ul class="dropdown-menu" aria-labelledby="addDropdown">
              <li><a class="dropdown-item" href="" id="add-user">Пользователя</a></li>
              <li><a class="dropdown-item" href="" id="add-course">Курс</a></li>
              <li><a class="dropdown-item" href="" id="add-schedule">Расписание</a></li>
              <li><a class="dropdown-item" href="" id="group-add">Группу</a></li>
              <li><a class="dropdown-item" href="" id="add-report">Отчёта</a></li>
              <li><a class="dropdown-item" href="" id="add-homework">Домашнего задания</a></li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="" id="editDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Редактировать
            </a>
            <ul class="dropdown-menu" aria-labelledby="editDropdown">
              <li><a class="dropdown-item" href="" id="edit-user">Пользователя</a></li>
              <li><a class="dropdown-item" href="" id="edit-course">Курс</a></li>
              <li><a class="dropdown-item" href="" id="edit-schedule">Расписание</a></li>
              <li><a class="dropdown-item" href="" id="edit-group">Группу</a></li>
              <li><a class="dropdown-item" href="" id="edit-report">Отчёта</a></li>
              <li><a class="dropdown-item" href="" id="edit-homework">Домашнего задания</a></li>
            </ul>
          </li>
        `;
      }

      // В конце — иконка пользователя с выпадающим меню
      itemsHtml += `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="" id="userDropdown" role="button"
            data-bs-toggle="dropdown" aria-expanded="false">
            <i class="fas fa-user-circle"></i>
          </a>

          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li><a class="dropdown-item" href="" id="user-settings">Настройки</a></li>
            <li><a class="dropdown-item" href="" id="logoutButton">Выйти</a></li>
          </ul>
        </li>
      `;
    }

    // Рендерим навбар и вешаем logout
    $("body").prepend(navStart + itemsHtml + navEnd);

    $("#logoutButton").on("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      location.reload();
    });
  }

  updateNavbar();
});
