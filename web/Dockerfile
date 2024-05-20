# WEB APP fe build
FROM node:20-alpine as web-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Launch nginx stable alpine
FROM nginx:stable-alpine as production-stage
COPY --from=web-build /app/dist /usr/share/nginx/html/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]