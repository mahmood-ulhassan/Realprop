const bcrypt = require('bcrypt');

async function generateAdminHash() {
  const email = 'mahmood.hassan7114@gmail.com';
  const password = 'Fatima@714';
  const name = 'Mahmood Hassan'; // You can change this
  const role = 'admin';

  // Hash the password (10 salt rounds - same as in the code)
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create the user object ready for MongoDB
  const userObject = {
    name: name,
    email: email.toLowerCase().trim(), // Ensure lowercase and trimmed
    passwordHash: passwordHash,
    role: role,
    projectIds: [], // Admin doesn't need projects
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.log('\n✅ Admin User Object for MongoDB:\n');
  console.log(JSON.stringify(userObject, null, 2));
  
  console.log('\n📋 MongoDB Insert Command:\n');
  console.log(`db.users.insertOne(${JSON.stringify(userObject, null, 2)})`);
  
  console.log('\n📝 User Details:\n');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: ${role}`);
  console.log(`Password Hash: ${passwordHash.substring(0, 20)}...`);
}

generateAdminHash().catch(console.error);

