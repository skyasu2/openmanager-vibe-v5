FROM python:3.10-slim

WORKDIR /app

RUN pip install flask

COPY main.py .

ENV PORT=8080
EXPOSE 8080

CMD ["python", "main.py"]
