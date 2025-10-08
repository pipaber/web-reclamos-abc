FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/package*.json ./
RUN npm ci --production --silent
EXPOSE 3000
CMD ["node", "server.js"]
