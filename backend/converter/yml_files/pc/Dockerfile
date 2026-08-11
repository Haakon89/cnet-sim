FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive

COPY resources/tools.txt /tmp/tools.txt
COPY resources/netem.sh /usr/local/bin/netem.sh
COPY resources/device_entrypoint.sh /usr/local/bin/device_entrypoint.sh
COPY resources/ssh_keys/fileserver_client_key /root/.ssh/fileserver_client_key
COPY resources/files/ /tmp/files/
RUN chmod 700 /root/.ssh \
 && chmod 600 /root/.ssh/fileserver_client_key

RUN apt-get update \
 && xargs -a /tmp/tools.txt apt-get install -y --no-install-recommends \
 && rm -rf /var/lib/apt/lists/* /tmp/tools.txt \
 && chmod +x /usr/local/bin/netem.sh /usr/local/bin/device_entrypoint.sh

CMD ["/usr/local/bin/device_entrypoint.sh"]