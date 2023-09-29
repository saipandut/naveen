const express = require('express');
const bodyParser = require('body-parser');
const firebaseAdmin = require('firebase-admin');
const app = express();

// Configure Firebase Admin SDK with your credentials
const serviceAccount = require('./key.json');
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});
// Create a reference to Firestore
const db = firebaseAdmin.firestore();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});
// Handle signup
app.post('/signup', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = req.body.user;

  // Check if the email is already in use
  try {
    const existingUser = await firebaseAdmin.auth().getUserByEmail(email);

    // If the email exists, return an error
    console.error('Email is already in use.');
    res.render('signup', { duplicateEmailError: true }); // Pass the error state
    return;
  } 
  catch (error) {
    // The error indicates that the email doesn't exist, proceed with signup
    if (error.code === 'auth/user-not-found') {
// Check password requirements
if (password.length < 8) {
  console.error('Password must be at least 8 characters long.');
  res.redirect('/signup');
  return;
}

  try {
    // Create a new user in Firebase Authentication
    const userRecord = await firebaseAdmin.auth().createUser({
      email: email,
      password: password,
      user:user,
    });
    // Store user details (email) in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      password: password,
      user:user,
    });
    console.log('Successfully created user with UID:', userRecord.uid);
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error creating user:', error);
    res.redirect('/signup');
  }}}
});
app.get('/logout', (req, res) => {
  res.render('logout');
});
app.get('/login', (req, res) => {
  res.render('login');
});
app.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
  
    try {
      // Fetch the user by email
      const userRecord = await firebaseAdmin.auth().getUserByEmail(email);
  
      // Verify the password locally
      if (userRecord && userRecord.email === email) {
        // You can also use Firebase's built-in password verification
        // const isPasswordValid = await firebaseAdmin.auth().verifyPassword(password, userRecord);
        // if (isPasswordValid) {
        console.log('Login successful');
        res.redirect('/dashboard');
        // } else {
        //   console.error('Incorrect password');
        //   res.redirect('/');
        // }
      } else {
        console.error('User not found');
        res.redirect('/');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.redirect('/');
    }
  });
  

app.get('/about', (req, res) => {
  res.render('about');
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});