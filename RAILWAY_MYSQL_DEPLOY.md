# ResQSync — Railway + MySQL deployment

This package keeps the existing Flask + MySQL backend. The recommended production split is:

**Vercel (frontend) → Railway (Flask API) → Railway MySQL**

Railway provides a MySQL database service and exposes `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, and `MYSQL_URL`.

## 1. Create the Railway project

1. Open https://railway.com/
2. Create a new project.
3. Click **+ New → Database → MySQL**.
4. Wait until MySQL is deployed.

## 2. Deploy the Flask backend

Push this project to GitHub, then in the Railway project choose **+ New → GitHub Repo** and select the repository.

Railway will use the included `Procfile`:

```text
web: gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT
```

The root `requirements.txt` already includes Flask, CORS, MySQL Connector and Gunicorn.

## 3. Connect the backend to Railway MySQL

In the backend service → **Variables**, add these reference variables. If your MySQL service is named `MySQL`, use:

```text
RESQ_DB_HOST=${{MySQL.MYSQLHOST}}
RESQ_DB_PORT=${{MySQL.MYSQLPORT}}
RESQ_DB_USER=${{MySQL.MYSQLUSER}}
RESQ_DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
RESQ_DB_NAME=${{MySQL.MYSQLDATABASE}}
```

If you named the database service something else, replace `MySQL` with that exact Railway service name. Railway reference variables use `${{SERVICE_NAME.VARIABLE}}`.

Also add:

```text
RESQ_CORS_ORIGINS=https://YOUR-VERCEL-DOMAIN.vercel.app
```

Optionally set a hardware key:

```text
RESQ_HARDWARE_KEY=YOUR_LONG_RANDOM_SECRET
```

## 4. Import the existing database

The existing schema is included at:

```text
database/resqsync.sql
```

For the easiest import, temporarily enable MySQL public access in the MySQL service under **Settings → Networking → Public Access**. Railway will expose `MYSQL_PUBLIC_URL`.

Then, from a machine with the MySQL client installed, import the dump:

```bash
mysql -h YOUR_PUBLIC_HOST -P YOUR_PUBLIC_PORT -u YOUR_MYSQL_USER -p resqsync < database/resqsync.sql
```

Use the public host/port shown by Railway and the MySQL password from Railway. Do not commit the public URL or password.

After the import, disable public access if you do not need external database access. The Railway backend can use the private MySQL variables above.

## 5. Run the ResQSync migration

After importing `database/resqsync.sql`, run the project's migration once. It adds the integration columns, tables and indexes required by the current backend.

From Railway's backend service shell, run:

```bash
python backend/migrate.py
```

For demo hospitals/junctions/signals, use:

```bash
python backend/migrate.py --seed-demo
```

Do not use `--seed-demo` if you do not want demo records.

## 6. Generate the Railway API domain

Backend service → **Settings → Networking → Generate Domain**.

Your API will then be available at a URL similar to:

```text
https://resqsync-backend-production.up.railway.app
```

Test:

```text
https://YOUR-RAILWAY-DOMAIN/api/health
```

The response should report the backend is running and the database is OK.

## 7. Connect Vercel frontend to Railway backend

Edit `config/config.js` and change:

```js
API_BASE_URL: "",
```

to:

```js
API_BASE_URL: "https://YOUR-RAILWAY-DOMAIN.up.railway.app",
```

Then redeploy the frontend to Vercel.

The browser will call:

```text
Vercel frontend
    ↓
https://YOUR-RAILWAY-DOMAIN/api/...
    ↓
Flask
    ↓
Railway MySQL
```

## 8. CORS

Set `RESQ_CORS_ORIGINS` in Railway to your actual Vercel URL, for example:

```text
https://resqsync.vercel.app
```

For a custom domain, use that exact origin instead. Do not add a trailing slash.

## 9. Important database notes

- Keep the MySQL service private unless you need external administration/imports.
- Do not put MySQL credentials in JavaScript or GitHub.
- Enable Railway backups for production data.
- The included SQL dump is MySQL 8.x format.
- The Flask backend reads all database credentials from `RESQ_DB_*` variables.

## 10. Quick deployment checklist

- [ ] Railway project created
- [ ] Railway MySQL created
- [ ] Backend deployed from GitHub
- [ ] Five `RESQ_DB_*` reference variables configured
- [ ] `RESQ_CORS_ORIGINS` configured
- [ ] `resqsync.sql` imported
- [ ] `python backend/migrate.py` executed
- [ ] Railway domain generated
- [ ] `/api/health` returns database OK
- [ ] `config/config.js` points to Railway API
- [ ] Vercel redeployed
- [ ] Dashboard tested

## Security

The existing project has `REQUIRE_AUTH: false`. This package does not invent an authentication system. Before exposing administrative/control endpoints publicly, add proper authentication and authorization.
