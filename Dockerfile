FROM node:12-alpine

# Create app directory
WORKDIR /opt/app

# Install app dependencies
COPY package*.json ./

RUN npm install

COPY . .

# default to port 80 for node
ARG PORT=80
ENV PORT $PORT
EXPOSE $PORT


CMD [ "node", "index.js" ]