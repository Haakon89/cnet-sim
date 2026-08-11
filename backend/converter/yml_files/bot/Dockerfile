FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive

COPY resources/tools.txt /tmp/tools.txt
COPY resources/netem.sh /usr/local/bin/netem.sh
COPY resources/device_entrypoint.sh /usr/local/bin/device_entrypoint.sh

RUN apt-get update \
 && xargs -a /tmp/tools.txt apt-get install -y --no-install-recommends \
 && rm -rf /var/lib/apt/lists/* /tmp/tools.txt \
 && chmod +x /usr/local/bin/netem.sh /usr/local/bin/device_entrypoint.sh

CMD ["/usr/local/bin/device_entrypoint.sh"]