FROM python:3.11-slim

WORKDIR /code

COPY app/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY .env .env

CMD ["python", "run.py"]
