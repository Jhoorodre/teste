# Etapa 1: Build da aplicação React
FROM node:18-alpine AS build

WORKDIR /usr/src/app/frontend

# Copia os arquivos de manifesto e instala as dependências
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm ci

# Copia o resto do código da aplicação
COPY ./frontend .

# Executa o build de produção
RUN npm run build

# Etapa 2: Servir a aplicação com Nginx
FROM nginx:1.21-alpine

# Copia os arquivos de build da etapa anterior
COPY --from=build /usr/src/app/frontend/dist /usr/share/nginx/html

# Copia a configuração do Nginx
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
