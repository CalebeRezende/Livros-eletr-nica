#!/usr/bin/env bash
# Deploy do Moodle em um VPS Ubuntu limpo (22.04/24.04), rodando como root.
#
# Uso:
#   curl -fsSL <raw-url-deste-arquivo> | bash
# ou, já com o arquivo local:
#   bash deploy-vps.sh
#
# Variaveis opcionais (defina antes de rodar, ex.: MOODLE_EMAIL=voce@x.com bash deploy-vps.sh):
#   MOODLE_EMAIL       email do administrador (default: admin@example.com)
#   MOODLE_SITE_NAME   nome do site (default: "Meu Moodle")
#   HTTP_PORT          porta HTTP exposta (default: 8080)

set -euo pipefail

MOODLE_DIR=/opt/moodle
HTTP_PORT="${HTTP_PORT:-8080}"
MOODLE_EMAIL="${MOODLE_EMAIL:-admin@example.com}"
MOODLE_SITE_NAME="${MOODLE_SITE_NAME:-Meu Moodle}"
REPO_RAW_BASE="https://raw.githubusercontent.com/CalebeRezende/Livros-eletr-nica/claude/moodle-local-setup-7jz87m/moodle"

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode este script como root (ex.: sudo bash deploy-vps.sh)." >&2
  exit 1
fi

echo "==> Instalando Docker (se necessário)"
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Preparando $MOODLE_DIR"
mkdir -p "$MOODLE_DIR"
cd "$MOODLE_DIR"
curl -fsSL -o docker-compose.yml "$REPO_RAW_BASE/docker-compose.yml"

if [ ! -f .env ]; then
  echo "==> Gerando .env com senhas aleatórias"
  gen_pass() { tr -dc 'A-Za-z0-9' </dev/urandom | head -c 20; }
  ADMIN_PASS=$(gen_pass)
  DB_PASS=$(gen_pass)
  ROOT_PASS=$(gen_pass)
  cat > .env << EOF
MARIADB_ROOT_PASSWORD=$ROOT_PASS
MOODLE_DATABASE_PASSWORD=$DB_PASS
MOODLE_HTTP_PORT=$HTTP_PORT
MOODLE_HTTPS_PORT=8443
MOODLE_USERNAME=admin
MOODLE_PASSWORD=$ADMIN_PASS
MOODLE_EMAIL=$MOODLE_EMAIL
MOODLE_SITE_NAME=$MOODLE_SITE_NAME
MOODLE_LANG=pt_br
EOF
  chmod 600 .env
else
  echo "==> .env já existe, mantendo como está"
fi

echo "==> Subindo os containers"
docker compose up -d

if command -v ufw &>/dev/null; then
  echo "==> Ajustando firewall (ufw)"
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow "${HTTP_PORT}/tcp" >/dev/null 2>&1 || true
  ufw --force enable >/dev/null 2>&1 || true
fi

# shellcheck disable=SC1091
source .env
PUBLIC_IP=$(curl -fsSL https://api.ipify.org || echo "SEU_IP_PUBLICO")

echo
echo "================================================================"
echo " Moodle instalando. Em 1-3 minutos acesse:"
echo "   http://$PUBLIC_IP:$HTTP_PORT"
echo
echo " Usuário admin: $MOODLE_USERNAME"
echo " Senha admin:   $MOODLE_PASSWORD"
echo
echo " Acompanhar instalação: docker logs -f moodle-app"
echo "================================================================"
