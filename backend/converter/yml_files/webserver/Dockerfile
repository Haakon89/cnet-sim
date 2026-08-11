FROM nginx:stable

RUN apt-get update && apt-get install -y --no-install-recommends \
    iproute2 \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

COPY resources/index.html /usr/share/nginx/html/index.html
COPY resources/netem.sh /usr/share/netem.sh

RUN chmod +x /usr/share/netem.sh

EXPOSE 80

CMD ["/usr/share/netem.sh"]