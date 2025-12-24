# How to Insert Admin User in MongoDB Compass

## Step-by-Step Instructions

### Step 1: Open MongoDB Compass
1. Connect to your MongoDB database
2. Find your database (check Backend/.env for MONGO_URI to see database name)
3. Click on the database name
4. Find the **`users`** collection (if it doesn't exist, MongoDB will create it)

### Step 2: Insert Document
1. Click on the **`users`** collection
2. Click the **"INSERT DOCUMENT"** button (top right)
3. A new document editor will open

### Step 3: Paste This JSON

**IMPORTANT:** Remove the `createdAt` and `updatedAt` fields - MongoDB will add these automatically via timestamps.

Copy and paste this **exact** JSON:

```json
{
  "name": "Mahmood Hassan",
  "email": "mahmood.hassan7114@gmail.com",
  "passwordHash": "$2b$10$v7d0phRP0wA09nC7vHGuq.Z6x2sg/h5Z7okVFQeLwoc2Rfw1yIr7m",
  "role": "admin",
  "projectIds": []
}
```

### Step 4: Save
1. Click **"INSERT"** button
2. The document should appear in the collection

### Step 5: Verify
- You should see the new user in the list
- Email should be: `mahmood.hassan7114@gmail.com`
- Role should be: `admin`

---

## Alternative: Use MongoDB Shell

If Compass doesn't work, open MongoDB Shell and run:

```javascript
use your_database_name

db.users.insertOne({
  "name": "Mahmood Hassan",
  "email": "mahmood.hassan7114@gmail.com",
  "passwordHash": "$2b$10$v7d0phRP0wA09nC7vHGuq.Z6x2sg/h5Z7okVFQeLwoc2Rfw1yIr7m",
  "role": "admin",
  "projectIds": []
})
```

---

## Troubleshooting

**If you see "duplicate key error":**
- The email already exists
- Delete the existing user first, or use a different email

**If document doesn't appear:**
- Refresh MongoDB Compass (F5)
- Check you're in the correct database
- Check you're in the `users` collection (not `user`)

**If login still doesn't work:**
- Make sure email is exactly: `mahmood.hassan7114@gmail.com` (lowercase)
- Make sure passwordHash is the complete hash (starts with `$2b$10$`)

---

## Test After Insertion

Run this to verify:
```bash
cd Backend
node scripts/verifyUser.js
```

Or test login in your frontend with:
- Email: `mahmood.hassan7114@gmail.com`
- Password: `Fatima@714`

