#!/bin/bash

LOGIN = ${1:-"no_login"};

npm run build;

if ["$LOGIN" = "login" ]; then
    npm login;
fi

cd ./dist;

npm publish;