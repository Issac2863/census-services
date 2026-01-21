FROM node:18-alpine As development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install -g @nestjs/cli
COPY . .
RUN nest build

FROM node:18-alpine As production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY --from=development /usr/src/app/dist ./dist
CMD ["node", "dist/main"]
