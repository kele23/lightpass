# WEB APP fe build
FROM node:lts as web-build
WORKDIR /app
COPY web/package*.json ./
RUN npm ci
COPY web .
RUN npm run build


FROM node:lts as launcher
WORKDIR /app
COPY api/package*.json ./
RUN npm ci
COPY api .
RUN npm run build

# init env
ENV COUCH_URL="http://192.168.68.107:5984"
ENV COUCH_USER=admin
ENV COUCH_PASSWORD=password
ENV COUCH_SECRET="12345678901234567890"
ENV PORT=3000
ENV NODE_ENV="production"
ENV JWT_SECRET="12345678901234567890"
ENV ADMIN_ROLE="lightpassAdmin"
ENV STANDARD_ROLE="lightpass"

# copy web in static folder under dist
COPY --from=web-build /app/dist ./dist/static

EXPOSE 3000
CMD ["npm", "start"]
