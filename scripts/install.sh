#!/bin/bash

echo "Conferindo usuario btc"
sudo useradd -r -s /usr/sbin/nologin btc &> /dev/null
sudo chown -R btc:btc /opt/btc-tracker/

echo "Instalando"
npm install -D typescript tsx @types/node

cp /opt/btc-tracker/config/btc-tracker.service /etc/systemd/system/
sudo systemctl daemon-reexec
sudo systemctl daemon-reload

echo "Habilitando btc-tracker no boot"
sudo systemctl enable btc-tracker

echo "Iniciando"
sudo systemctl start btc-tracker

