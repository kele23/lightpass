# API build
FROM node:20-alpine as launcher
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# init env
ENV COUCH_URL="http://localhost:5984"
ENV COUCH_USER=admin
ENV COUCH_SECRET="1234567890"
ENV PORT=3000
ENV NODE_ENV="dev"
ENV JWT_SECRET="1234567890"
ENV ADMIN_ROLE="lightpassAdmin"
ENV STANDARD_ROLE="lightpass"

# run
EXPOSE 3000
CMD ["npm", "start"]