# Gotlandsguiden i Proxmox (egen tjänst)

Denna setup kör appen som en separat tjänst i en VM eller LXC på Proxmox, med persistent databas (SQLite) och Docker Compose.

## 1) Rekommenderad Proxmox-resurs

- Debian 12 VM eller privilegierad LXC
- 1 vCPU, 1-2 GB RAM, 10+ GB disk
- Statisk IP eller DHCP-reservation

## 2) Installera Docker i gästmaskinen

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
sudo usermod -aG docker $USER
```

Logga in igen efter gruppändringen.

## 3) Lägg projektet på servern

```bash
sudo mkdir -p /opt
cd /opt
sudo git clone <din-repo-url> gotlandsguiden
sudo chown -R $USER:$USER /opt/gotlandsguiden
cd /opt/gotlandsguiden
```

## 4) Konfigurera miljö

```bash
cd /opt/gotlandsguiden/deploy/proxmox
cp .env.example .env
```

Sätt värden i `.env`:

- `API_KEY` för skydd av POST `/api/places`
- `WEB_PORT` för extern publicering (default `3003`)

## 5) Starta stacken

```bash
cd /opt/gotlandsguiden
docker compose -f deploy/proxmox/docker-compose.yml up -d --build
docker compose -f deploy/proxmox/docker-compose.yml ps
```

App: `http://<server-ip>:<WEB_PORT>`

## 6) Aktivera autostart via systemd

```bash
sudo cp /opt/gotlandsguiden/deploy/proxmox/gotlandsguiden.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gotlandsguiden.service
sudo systemctl status gotlandsguiden.service
```

## 7) Backup av databas

Skapa backup manuellt:

```bash
cd /opt/gotlandsguiden/deploy/proxmox
chmod +x backup.sh
./backup.sh
```

Backuper sparas i `deploy/proxmox/backups/`.

Aktivera nattlig backup via systemd timer (03:30 varje natt):

```bash
sudo cp /opt/gotlandsguiden/deploy/proxmox/gotlandsguiden-backup.service /etc/systemd/system/
sudo cp /opt/gotlandsguiden/deploy/proxmox/gotlandsguiden-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gotlandsguiden-backup.timer
sudo systemctl list-timers --all | grep gotlandsguiden-backup
```

## 8) Reverse proxy och domän (valfritt)

Peka Nginx Proxy Manager/Traefik eller annan reverse proxy till:

- Host: Proxmox-gästens IP
- Port: `WEB_PORT` från `.env`

För TLS: använd Let's Encrypt i din reverse proxy.

## Driftkommandon

```bash
cd /opt/gotlandsguiden

# Rekommenderat: enkommandodeploy
./deploy/proxmox/deploy.sh

# Start / stop
 docker compose -f deploy/proxmox/docker-compose.yml up -d
 docker compose -f deploy/proxmox/docker-compose.yml down

# Loggar
 docker compose -f deploy/proxmox/docker-compose.yml logs -f

# Uppdatera och rebuild
 git pull
 docker compose -f deploy/proxmox/docker-compose.yml up -d --build
```
