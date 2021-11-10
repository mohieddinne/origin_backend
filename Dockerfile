# This file is a template, and might need editing before it works on your project.
FROM node:12.13-alpine 

RUN apk add --no-cache python make g++ gcc pkgconfig pixman-dev cairo-dev pango-dev libjpeg-turbo-dev giflib-dev

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

ENV NODE_ENV $NODE

COPY $CI_PROJECT_DIR/config.json /usr/src/app/
COPY $CI_PROJECT_DIR/. /usr/src/app

RUN npm run build

EXPOSE 8880
CMD [ "node", "build/app.js" ]
