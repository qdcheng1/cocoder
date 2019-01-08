#!/bin/bash
fuser -k 3000/tcp
fuser -k 5000/tcp

service redis_6379 start
cd ./oj-server
nodemon server.js &
cd ../executor
python executor_server.py &

echo "==================================="
read -p "PRESS [ENTER] TO TERMINATE PROCESS." PRESSKEY

fuser -k 3000/tcp
fuser -k 5000/tcp
service redis_6379 stop
