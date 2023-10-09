const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dateStrings: 'date',
  database: 'SRMS',
});

const selectID = (id) => {
  return new Promise((resolve, reject) => {
    const sql1 = 'SELECT st_name FROM staff WHERE st_id = ?';
    db.query(sql1, [id], (err, results) => {
      if (err) {
        return reject(err);
      }
      return resolve(results);
    });
  });
};

const setJsonContentType = (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
};

const requireAuth = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    req.flash('error_msg', 'You need to login as STAFF in order to view that source!');
    return res.redirect('/unauthorized');
  }

  try {
    const result = await jwt.verify(token, process.env.JWT_SECRET);
    const data = await selectID(result.id);

    if (data.length === 0) {
      console.error('No user found for the given ID:', result.id);
      req.flash('error_msg', 'You need to login as STAFF in order to view that source!');
      return res.redirect('/unauthorized');
    }

    req.user = result.id;
    console.log('User:', req.user); // Log the user object
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      req.flash('error_msg', 'Your session has expired. Please log in again.');
    } else {
      console.error('Error during JWT verification:', err);
      req.flash('error_msg', 'An error occurred. Please try again.');
    }
    res.redirect('/unauthorized');
  }
};

const forwardAuth = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    try {
      const result = await jwt.verify(token, process.env.JWT_SECRET);
      const data = await selectID(result.id);

      if (data.length !== 0) {
        req.user = result.id;
        return res.redirect('/staff/dashboard');
      }
    } catch (err) {
      console.error('Error during JWT verification:', err);
      next();
    }
  }

  next();
};

module.exports = { requireAuth, forwardAuth, setJsonContentType };
