FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive

COPY resources/tools.txt /tmp/tools.txt
COPY resources/sample_files/ /storage/
COPY resources/netem.sh /usr/local/bin/netem.sh
COPY resources/fileserver_entrypoint.sh /usr/local/bin/fileserver_entrypoint.sh
COPY resources/ssh_keys/fileserver_client_key.pub /tmp/fileserver_client_key.pub

RUN apt-get update \
 && xargs -a /tmp/tools.txt apt-get install -y --no-install-recommends \
 && rm -rf /var/lib/apt/lists/* /tmp/tools.txt \
 && chmod +x /usr/local/bin/netem.sh /usr/local/bin/fileserver_entrypoint.sh

CMD ["/usr/local/bin/fileserver_entrypoint.sh"]