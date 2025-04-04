# entrypoint.sh
#!/usr/bin/env bash
echo "SA_PASSWORD is: '$SA_PASSWORD'"
/opt/mssql/bin/sqlservr &
echo "Waiting for SQL Server to start..."
sleep 20
echo "Checking if database 'CesiMangeAuth' exists..."
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -Q "IF DB_ID('CesiMangeAuth') IS NULL CREATE DATABASE CesiMangeAuth"
echo "Running seed scripts in /init-sql..."
for f in /init-sql/*.sql; do
  if [ -f "$f" ]; then
    echo "Running seed script: $f"
    /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -d CesiMangeAuth -i "$f"
  fi
done
wait
