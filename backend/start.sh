#!/usr/bin/env bash
# Démarrage production : applique les migrations Alembic puis lance uvicorn.
# Cas particulier : si la base existe déjà (créée avant l'adoption d'Alembic),
# elle n'a pas de table alembic_version — on la "stamp" au lieu de rejouer
# la migration initiale (qui échouerait sur les CREATE TABLE).
set -euo pipefail

NEEDS_STAMP=$(python -c "
import os, psycopg2
url = os.environ['DATABASE_URL'].replace('postgresql+asyncpg://', 'postgresql://')
conn = psycopg2.connect(url)
cur = conn.cursor()
cur.execute(\"SELECT to_regclass('public.alembic_version') IS NOT NULL, to_regclass('public.users') IS NOT NULL\")
has_version, has_schema = cur.fetchone()
conn.close()
print('yes' if (has_schema and not has_version) else 'no')
")

if [ "$NEEDS_STAMP" = "yes" ]; then
  echo "Schéma existant sans alembic_version — alembic stamp head"
  alembic stamp head
fi

alembic upgrade head
exec uvicorn server:app --host 0.0.0.0 --port "${PORT:-8000}"
