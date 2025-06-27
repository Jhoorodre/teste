# Usar uma imagem base do Python
FROM python:3.11-slim

# Definir variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Definir o diretório de trabalho
WORKDIR /usr/src/app/backend

# Instalar as dependências
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o código do projeto
COPY ./backend .

# Expõe a porta 8000
EXPOSE 8000

# Comando para iniciar o servidor (usando Gunicorn para produção)
RUN pip install gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "mangareader_backend.wsgi:application"]
