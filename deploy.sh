rm -rf /docker/hugo/input/*
cp -r /docker/spicykiwi/* /docker/hugo/input
docker compose -f/docker/hugo/docker-compose.yml up
rm -rf /docker/webserver/var/www/spicy.nox.kiwi/*
mv /docker/hugo/output/* /docker/webserver/var/www/spicy.nox.kiwi/
