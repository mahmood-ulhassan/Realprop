# Deployment Guide: GitHub & Digital Ocean

## Part 1: Push to GitHub

### Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in the details:
   - **Repository name**: `realprop` (or your preferred name)
   - **Description**: "Realprop - Real Estate Property Management System"
   - **Visibility**: Choose **Private** (recommended) or **Public**
   - **DO NOT** check "Initialize with README" (we already have files)
4. Click **"Create repository"**

### Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Make sure you're in the project root
cd "E:\The Real Point\The Real Point\Realprop"

# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/realprop.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Note**: You'll be prompted for your GitHub username and password/token.

### Step 3: Authentication

If you get authentication errors:
- Use a **Personal Access Token** instead of password:
  1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Generate new token with `repo` permissions
  3. Use the token as your password when pushing

---

## Part 2: Deploy to Digital Ocean

### Option A: App Platform (Easiest - Recommended)

#### Step 1: Create Digital Ocean Account
1. Go to [DigitalOcean.com](https://www.digitalocean.com)
2. Sign up for an account
3. Add payment method (they have a free trial)

#### Step 2: Create App
1. Go to **Apps** → **Create App**
2. Connect your GitHub account
3. Select your `realprop` repository
4. Choose the branch: `main`

#### Step 3: Configure Backend Service
1. Digital Ocean will detect your Backend folder
2. Configure:
   - **Name**: `backend`
   - **Source Directory**: `Backend`
   - **Build Command**: `npm install`
   - **Run Command**: `npm run dev` (or `node src/server.js` for production)
   - **Environment Variables**:
     ```
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=ilovemydaughterfatimasheikh
     NODE_ENV=production
     ```

#### Step 4: Configure Frontend Service
1. Add another component → **Static Site**
2. Configure:
   - **Source Directory**: `Frontend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://your-backend-url.ondigitalocean.app
     ```

#### Step 5: Database Setup
1. In Digital Ocean, go to **Databases** → **Create Database**
2. Choose **MongoDB**
3. Select a plan
4. Copy the connection string
5. Update `MONGO_URI` in your backend environment variables

#### Step 6: Deploy
1. Review your app configuration
2. Click **"Create Resources"**
3. Wait for deployment (5-10 minutes)

---

### Option B: Droplet (More Control)

#### Step 1: Create Droplet
1. Go to **Droplets** → **Create Droplet**
2. Choose:
   - **Image**: Ubuntu 22.04
   - **Plan**: Basic ($6/month minimum)
   - **Region**: Choose closest to you
   - **Authentication**: SSH keys (recommended) or password

#### Step 2: Connect to Droplet
```bash
ssh root@YOUR_DROPLET_IP
```

#### Step 3: Install Node.js
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### Step 4: Install MongoDB
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
apt update
apt install -y mongodb-org

# Start MongoDB
systemctl start mongod
systemctl enable mongod
```

#### Step 5: Clone Repository
```bash
# Install Git
apt install -y git

# Clone your repository
cd /var/www
git clone https://github.com/YOUR_USERNAME/realprop.git
cd realprop
```

#### Step 6: Setup Backend
```bash
cd Backend

# Install dependencies
npm install

# Create .env file
nano .env
```

Add to `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/realprop
JWT_SECRET=ilovemydaughterfatimasheikh
NODE_ENV=production
```

#### Step 7: Setup Frontend
```bash
cd ../Frontend

# Install dependencies
npm install

# Build for production
npm run build

# Install a web server (nginx)
apt install -y nginx
```

#### Step 8: Configure Nginx
```bash
nano /etc/nginx/sites-available/realprop
```

Add:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Frontend
    location / {
        root /var/www/realprop/Frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/realprop /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 9: Run Backend with PM2
```bash
# Install PM2
npm install -g pm2

# Start backend
cd /var/www/realprop/Backend
pm2 start src/server.js --name realprop-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Step 10: Setup SSL (Optional but Recommended)
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com
```

---

## Environment Variables Summary

### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/realprop
JWT_SECRET=ilovemydaughterfatimasheikh
NODE_ENV=production
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
# For production, use your backend URL:
# VITE_API_URL=https://your-backend-url.com
```

---

## Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend is serving correctly
- [ ] MongoDB connection is working
- [ ] Environment variables are set correctly
- [ ] API endpoints are accessible
- [ ] Login functionality works
- [ ] SSL certificate is installed (if using domain)

---

## Troubleshooting

### Backend won't start
- Check MongoDB is running: `systemctl status mongod`
- Verify .env file exists and has correct values
- Check logs: `pm2 logs realprop-backend`

### Frontend can't connect to backend
- Verify `VITE_API_URL` in Frontend/.env
- Check CORS settings in Backend
- Ensure backend is running on correct port

### 502 Bad Gateway
- Backend might not be running
- Check nginx error logs: `tail -f /var/log/nginx/error.log`
- Verify proxy_pass URL in nginx config

---

## Need Help?

- Digital Ocean Docs: https://docs.digitalocean.com
- MongoDB Docs: https://docs.mongodb.com
- Node.js Docs: https://nodejs.org/docs

