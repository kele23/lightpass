# Use the node image from official Docker Hub
FROM node:lts as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build


# Use NGINX
FROM nginx:latest as production-stage

RUN mkdir -p /etc/nginx/scripts
COPY --from=build-stage /app/dist /usr/share/nginx/html/
COPY ./docker/default.conf.template /etc/nginx/conf.d/
COPY ./docker/run-nginx.sh /etc/nginx/scripts/
RUN chmod +x /etc/nginx/scripts/run-nginx.sh

ENV COUCHDB_URL=http://192.168.68.107:5984/

EXPOSE 80
EXPOSE 443
CMD /etc/nginx/scripts/run-nginx.sh