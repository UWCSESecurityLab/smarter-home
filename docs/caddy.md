## Caddy deployment notes

Caddy is the web server for SmarterHome - it provides TLS and proxies the prod
and dev Express instances to different subdomains. It's run as a system.d
service on kadara.

### Runbook
* The Caddy binary is in /usr/local/bin
* Caddyfile is in /etc/caddy
* Certs are in /etc/ssl/caddy
* Logs are in /var/log/caddy
* Service documentation is at: https://github.com/mholt/caddy/tree/master/dist/init/linux-systemd
* How to start/stop the service:
    - sudo systemctl start caddy.service
    - sudo systemctl stop caddy.service
    - journalctl -f -u caddy.service