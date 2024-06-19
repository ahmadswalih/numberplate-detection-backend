#!/bin/bash
cd /home/ubuntu/numberplate-detection-backend
git pull origin master
npm install
pm2 restart numberplate-identification
