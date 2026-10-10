# TransitSync: Deployment Guide (Production & Cloud)

This guide documents the exact configuration steps to deploy the TransitSync project across cloud platforms (Vercel / Netlify / Render / Docker).

---

## 1. Cloud Database Setup (Aiven / Supabase / AWS RDS MySQL)

1. Provision a MySQL 8.0 instance on [Aiven](https://aiven.io/) or [AWS RDS].
2. Note your connection details:
   - Host, Port (e.g. `3306`), Database name (`transitsync_db`), Username, Password.
3. Test connectivity locally:
   ```bash
   mysql -h <host> -P <port> -u <user> -p <database>
   ```

---

## 2. Backend Deployment on Render

1. Create a new **Web Service** on [Render](https://render.com/).
2. Select your repository: `https://github.com/AshwithReddy28/TransitSync---Intercity-Bus-Fleet-Booking-System`.
3. Set the **Root Directory** to `backend`.
4. Configure environment:
   - **Environment**: Docker (Render will automatically detect `backend/Dockerfile`).
   - Alternatively (Native Java):
     - **Build Command**: `mvn clean package -DskipTests`
     - **Start Command**: `java -jar target/transitsync-backend-1.0.0.jar`
5. Configure Environment Variables in Render:
   - `DB_URL`: `jdbc:mysql://<host>:<port>/transitsync_db?createDatabaseIfNotExist=true&useSSL=true&serverTimezone=UTC`
   - `DB_USER`: `<your-db-user>`
   - `DB_PASSWORD`: `<your-db-password>`
   - `JWT_SECRET`: `<minimum-256-bit-random-secret-key>`
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
   - `ADMIN_BOOTSTRAP_ENABLED`: `true`
   - `ADMIN_BOOTSTRAP_EMAIL`: `admin@transitsync.com`
   - `ADMIN_BOOTSTRAP_PASSWORD`: `<StrongAdminPassword>`
6. Verify Deployment:
   - Navigate to `https://<your-service>.onrender.com/actuator/health` -> Expect `{"status":"UP"}`.
   - Navigate to `https://<your-service>.onrender.com/swagger-ui.html` -> View live interactive OpenAPI docs.

---

## 3. Frontend Deployment on Vercel / Netlify

### Deploy on Vercel
1. In Vercel, import your Git repository.
2. Set the **Root Directory** to `frontend`.
3. Set Build & Output Settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://<your-backend-service>.onrender.com`
5. Configure SPA fallback (Create `vercel.json` in `frontend/` if needed):
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
6. Click **Deploy**.
