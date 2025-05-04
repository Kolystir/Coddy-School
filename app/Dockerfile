# Используем официальный образ Python с минимальным размером
FROM python:3.11-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файл с зависимостями в контейнер
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код приложения
COPY . .

# Открываем порт, на котором будет работать FastAPI
EXPOSE 8000

# Команда запуска приложения
# main:app — модуль main.py и объект FastAPI() с именем app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
