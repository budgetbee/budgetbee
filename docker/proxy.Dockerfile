FROM nginx:1.25.1-alpine3.17-slim
COPY docker/default.conf /etc/nginx/conf.d/default.conf
