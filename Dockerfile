FROM node:11-alpine
LABEL "maintainer"="syuchan1005<syuchan.dev@gmail.com>"
LABEL "name"="LoveSync"

COPY ./ /lovesync/

WORKDIR /lovesync

RUN apk add --no-cache git python2 build-base \
    && npm i && npm i node-sass sqlite3 && npm run build \
    && apk del --purge git python2 build-base

ENV PORT=80
EXPOSE $PORT

CMD ["npm", "start"]
