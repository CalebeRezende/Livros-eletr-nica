# Meu Moodle (Docker Compose)

Stack para rodar uma instância própria do Moodle localmente usando Docker,
com Apache + PHP + Moodle (`bitnamilegacy/moodle`) e banco de dados MariaDB
(`bitnamilegacy/mariadb`). Testada e validada nesta configuração: a
instalação roda sozinha (não precisa passar pelo instalador web) e o site
sobe em poucos minutos.

## Pré-requisitos

- Docker instalado e rodando
- Docker Compose (já incluso no Docker recente, comando `docker compose`)

## Como subir

```bash
cd moodle
cp .env.example .env
# edite o .env e troque todas as senhas (não use "#" nas senhas: o .env
# trata "#" como início de comentário e corta o valor)
docker compose up -d
```

Acompanhe a instalação (leva 1 a 3 minutos na primeira vez):

```bash
docker compose logs -f moodle
```

Quando aparecer `** Starting Apache **` nos logs, o site está pronto em:

- http://localhost:8080 (porta configurável em `MOODLE_HTTP_PORT`)
- https://localhost:8443 (certificado autoassinado, porta em `MOODLE_HTTPS_PORT`)

Faça login com o usuário/senha definidos em `MOODLE_USERNAME` /
`MOODLE_PASSWORD` no `.env`.

## Rodar em um VPS (para outras pessoas acessarem)

Se você tem (ou vai criar) um VPS Ubuntu 22.04/24.04 com IP público, use o
script `deploy-vps.sh`: ele instala o Docker, baixa o `docker-compose.yml`
deste repositório, gera senhas aleatórias e sobe o Moodle já com a porta
liberada no firewall.

1. Crie o servidor (ex.: Hetzner CX22 ou DigitalOcean, ~2-4 GB de RAM,
   Ubuntu 24.04 LTS) e anote o IP público.
2. Acesse via SSH como root: `ssh root@SEU_IP`
3. Rode:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/CalebeRezende/Livros-eletr-nica/claude/moodle-local-setup-7jz87m/moodle/deploy-vps.sh | bash
   ```

   (ajuste a URL para `main` depois que este branch for mesclado). Para
   personalizar e-mail/nome do site/porta:

   ```bash
   MOODLE_EMAIL=voce@exemplo.com MOODLE_SITE_NAME="Meu Moodle" HTTP_PORT=8080 \
     curl -fsSL https://raw.githubusercontent.com/CalebeRezende/Livros-eletr-nica/claude/moodle-local-setup-7jz87m/moodle/deploy-vps.sh | bash
   ```

4. Ao final, o script imprime a URL (`http://SEU_IP:8080`) e as
   credenciais do administrador — é esse link que você compartilha com quem
   for testar.

Isso deixa o Moodle acessível por HTTP simples (sem certificado), o que é
suficiente para teste. Para uso contínuo/produção, aponte um domínio para o
IP e coloque um proxy reverso com HTTPS (ex. Caddy) na frente.

## Parar / reiniciar

```bash
docker compose stop      # para os containers, mantém os dados
docker compose up -d     # sobe de novo com os mesmos dados
docker compose down      # remove os containers (mantém os volumes/dados)
docker compose down -v   # remove TUDO, inclusive os dados (reset total)
```

## Persistência dos dados

Os dados ficam em volumes nomeados do Docker:

- `mariadb_data` — banco de dados
- `moodle_data` — código/arquivos internos do Moodle
- `moodledata_data` — uploads, cursos, arquivos enviados pelos usuários

Fazer backup = fazer backup desses volumes (ex.: `docker run --rm -v
moodle_moodledata_data:/data -v $(pwd):/backup alpine tar czf
/backup/moodledata.tar.gz /data`).

## Observações

- As imagens usadas são do namespace `bitnamilegacy` porque a Bitnami
  passou a exigir assinatura paga para publicar novas versões das imagens
  `bitnami/*` a partir de 2025. As imagens `bitnamilegacy/*` são as últimas
  versões gratuitas congeladas (não recebem mais atualizações de segurança).
  Para uso além de estudo/homelab, considere trocar por outra distribuição
  (ex.: instalação manual do Moodle, ou outra imagem mantida) e manter o
  Moodle atualizado.
- Este setup é para uso local/homelab. Para expor na internet, coloque um
  proxy reverso com HTTPS válido (ex. Caddy/Traefik) na frente e ajuste
  `$CFG->wwwroot` nas configurações do Moodle.
