#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE instos_test;
    GRANT ALL PRIVILEGES ON DATABASE instos_test TO postgres;
EOSQL
