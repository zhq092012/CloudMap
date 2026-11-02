FROM nginx:1.31.3

# 后端完整地址,部署时通过 -e BACKEND_URL=... 覆盖
ENV BACKEND_API_URL=http://localhost:8080
# 替换名为 BACKEND_API_URL 的环境变量,保留 nginx 自身的 $host/$uri 等
ENV NGINX_ENVSUBST_FILTER=BACKEND_API_URL

COPY docker/nginx.conf /etc/nginx/templates/default.conf.template
COPY dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
