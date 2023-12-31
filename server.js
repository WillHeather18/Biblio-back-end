const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const secretKey = crypto.randomBytes(64).toString('hex');

const port = process.env.PORT || 8080;

const app = express();

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://HEv_18:B0bsnowy66!@bibliobox.eiqrhme.mongodb.net/user_details";
mongoose.connect(uri);

const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

const userSchema = new mongoose.Schema({
    uuid: { type: String, default: uuidv4() },
    email: String,
    password: String,
    accountCreationDate: { type: Date, default: Date.now },
    lastLoginDate: { type: Date, default: Date.now },
  });

  const recommendationSchema = new mongoose.Schema({
    uuid: { type: String, default: uuidv4() },
    recommendations: [String],
});
  
  const User = mongoose.model('User', userSchema);
  const Recommendations = mongoose.model('recommendations', recommendationSchema);
  

app.listen(port, () => {
    console.log("Server is running on Port: " + port);
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
      const bearer = bearerHeader.split(' ');
      const bearerToken = bearer[1];
      jwt.verify(bearerToken, secretKey, (err, data) => {
          if (err) {
              res.sendStatus(403);
          } else {
              req.userData = data;
              next();
          }
      });
  } else {
      res.sendStatus(403);
  }
}

app.get('/', (req, res) => {
  res.send('Welcome to my Bibliobox!');
});

// Health check endpoint
app.get('/healthcheck', (req, res) => {
  res.status(200).send('Health check passed');
});

//Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ status: "failure",message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
          return res.status(400).json({ status: "failure", message: 'Invalid password' });
      }
  
      const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: '1h' });

      const { password: userPassword, ...userWithoutPassword } = user.toObject();

      res.status(200).json({ status: "success", message: 'Logged in successfully', token,  user: userWithoutPassword });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: "error",message: 'Server error' });
    }
  },
);
  


// Signup endpoint
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
  
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ status: "failure", message: 'Invalid email format' });
    }

    try {
      console.log(`Creating user with email: ${email}`);
      const existingUser = await User.findOne({ email });
  
      if (existingUser) {
        return res.status(400).json({ status: "failure", message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = new User({ email, password: hashedPassword});
      await user.save();
  
      const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: '1h' });
        res.status(200).json({ status: "success", message: 'User created successfully', token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: "error", message: 'Server error' });
    }
  });

// Recommendation endpoint
app.get('/recommendations/:uuid', async (req, res) => {
  try {
      const uuid = req.params.uuid;
      const recommendations = await Recommendations.find({ uuid: uuid });

      if (!recommendations || recommendations.length === 0) {
          return res.status(404).json({ status: "failure", message: 'No recommendations found for the provided uuid' });
      }

      res.status(200).json({ status: "success", recommendations: recommendations });
  } catch (err) {
      console.error(err);
      res.status(500).json({ status: "error", message: 'Server error' });
  }
});


  

  

