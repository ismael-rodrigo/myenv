read -p "Tem certeza que deseja continuar? (y/n) " resposta
if [[ "$resposta" != "y" ]]; then
    echo "❌ Instalação cancelada."
    exit 1
fi
git clone https://github.com/ismael-rodrigo/myenv.git
cd myenv
docker network create traefik_proxy
docker compose up -d
echo "✅ Instalação concluída."


