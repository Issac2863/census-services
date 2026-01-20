FROM node:18-alpine As development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
RUN npm install -g @nestjs/cli
COPY . .
RUN nest build

FROM node:18-alpine As production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=development /usr/src/app/dist ./dist
CMD ["node", "dist/main"]
