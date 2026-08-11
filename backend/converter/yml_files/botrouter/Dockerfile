FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive

COPY resources/tools.txt /tmp/tools.txt
COPY resources/capture.sh /usr/local/bin/capture.sh
COPY resources/router_entrypoint.sh /usr/local/bin/router_entrypoint.sh

RUN apt-get update \
 && xargs -a /tmp/tools.txt apt-get install -y --no-install-recommends \
 && rm -rf /var/lib/apt/lists/* /tmp/tools.txt \
 && chmod +x /usr/local/bin/router_entrypoint.sh /usr/local/bin/capture.sh

CMD ["/usr/local/bin/router_entrypoint.sh"]

