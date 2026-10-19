#!/bin/bash
set -e
apt-get update
apt-get install -y python3 python3-venv python3-pip nodejs npm nginx postgresql postgresql-contrib git
echo "Provisioning base complete."
