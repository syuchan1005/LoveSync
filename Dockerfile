FROM node:11-alpine
LABEL "maintainer"="syuchan1005<syuchan.dev@gmail.com>"
LABEL "name"="LoveSync"

RUN apk add --no-cache python2 git build-base \
    && git clone 'https://github.com/syuchan1005/lovesync' \
    && cd lovesync && npm i  && npm i node-sass sqlite3 && npm run build \
    && apk del --purge git python2 build-base

EXPOSE 80
ENV PORT=80

CMD ["npm", "start"]
