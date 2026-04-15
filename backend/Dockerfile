FROM python:3.12-slim

WORKDIR /workspace

# Install system dependencies (psycopg build/runtime) across distros
RUN set -eux; \
    if command -v apt-get >/dev/null 2>&1; then \
        apt-get update; \
        apt-get install -y --no-install-recommends gcc libpq-dev; \
        rm -rf /var/lib/apt/lists/*; \
    elif command -v dnf >/dev/null 2>&1; then \
        dnf install -y gcc postgresql-devel; \
        dnf clean all; \
    elif command -v microdnf >/dev/null 2>&1; then \
        microdnf install -y gcc postgresql-devel; \
        microdnf clean all; \
    else \
        echo "No supported package manager found (apt-get, dnf, microdnf)." >&2; \
        exit 1; \
    fi

COPY requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
