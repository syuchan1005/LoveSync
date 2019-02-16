FROM node:11-alpine
LABEL "maintainer"="syuchan1005<syuchan.dev@gmail.com>"
LABEL "name"="LoveSync"

RUN apk add --no-cache python2 git \
    && git clone 'https://github.com/syuchan1005/lovesync' \
    && cd lovesync && npm i && npm run build \
    && apk del --purge git python2

EXPOSE 80
ENV PORT=80

CMD ["npm", "start"]
