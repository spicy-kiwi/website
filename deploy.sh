rm -rf /docker/hugo/input/*
cp -r /docker/spicykiwi/* /docker/hugo/input
docker start hugo
rm -rf /docker/webserver/var/www/spicy.nox.kiwi/*
mv /docker/hugo/output/* /docker/webserver/var/www/spicy.nox.kiwi/
