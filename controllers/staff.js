const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const mailgun = require('mailgun-js');
const DOMAIN = process.env.DOMAIN_NAME;
const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN });
const XLSX = require('xlsx');
const multer = require('multer');
const { error } = require('update/lib/utils');
const upload = multer({ dest: 'uploads/' });



const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  dateStrings: 'date',
  database: 'SRMS',
});

// Database query promises
const zeroParamPromise = (sql) => {
  return new Promise((resolve, reject) => {
    db.query(sql, (err, results) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });
};

const queryParamPromise = (sql, queryParam) => {
  return new Promise((resolve, reject) => {
    db.query(sql, queryParam, (err, results) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });
};

// LOGIN
exports.getLogin = (req, res, next) => {
  res.render('Staff/login');
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  let errors = [];
  const sql1 = 'SELECT * FROM staff WHERE email = ?';
  const users = await queryParamPromise(sql1, [email]);
  if (
    users.length === 0 ||
    !(await bcrypt.compare(password, users[0].password))
  ) {
    errors.push({ msg: 'Email or Password is Incorrect' });
    res.status(401).render('Staff/login', { errors });
  } else {
    const token = jwt.sign({ id: users[0].st_id }, process.env.JWT_SECRET, {
      expiresIn: 8600,
    });
    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect('/staff/dashboard');
  }
};

exports.getDashboard = async (req, res, next) => {
  console.log('Requested Route:', req.path);
  const sql1 = 'SELECT * FROM staff WHERE st_id = ?';
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);
  res.render('Staff/dashboard', { user: data[0], page_name: 'overview' });
};

exports.getProfile = async (req, res, next) => {
  const sql1 = 'SELECT * FROM staff WHERE st_id = ?';
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);
  const userDOB = data[0].dob;
  const sql2 = 'SELECT d_name FROM department WHERE dept_id = ?';
  const deptData = await queryParamPromise(sql2, [data[0].dept_id]);

  const sql3 =
    'SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id;';
  const classData = await queryParamPromise(sql3, [data[0].st_id]);

  res.render('Staff/profile', {
    user: data[0],
    userDOB,
    deptData,
    classData,
    page_name: 'profile',
  });
};

exports.getTimeTable = async (req, res, next) => {
  const staffData = (
    await queryParamPromise('SELECT * FROM staff WHERE st_id = ?', [req.user])
  )[0];
  const timeTableData = await queryParamPromise(
    'select * from time_table where st_id = ? order by day, start_time',
    [req.user]
  );
  console.log(timeTableData);
  const startTimes = ['10:00', '11:00', '12:00', '13:00'];
  const endTimes = ['11:00', '12:00', '13:00', '14:00'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  res.render('Staff/timetable', {
    page_name: 'timetable',
    timeTableData,
    startTimes,
    staffData,
    endTimes,
    dayNames,
  });
};

exports.getAttendance = async (req, res, next) => {
  const sql1 = 'SELECT * FROM staff WHERE st_id = ?';
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);

  const sql3 =
    'SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id ORDER BY cl.semester;';
  const classData = await queryParamPromise(sql3, [data[0].st_id]);

  res.render('Staff/selectClassAttendance', {
    user: data[0],
    classData,
    btnInfo: 'Students List',
    page_name: 'attendance',
  });
};

exports.markAttendance = async (req, res, next) => {
  const { classdata, date } = req.body;
  if (!classdata) {
    return res.status(400).json({ error: 'classdata is required' });
  }
  const regex1 = /[A-Z]+[0-9]+/g;
  const regex2 = /[A-Z]+-[0-9]+/g;
  const match1 = classdata.match(regex1);
  const match2 = classdata.match(regex2);

  // Check if the regex matches are found
  if (!match1 || !match2) {
    return res.status(400).json({ error: 'Invalid classdata format' });
  }
  const c_id = match1[0];
  const class_sec = match2[0].split('-');
  const staffId = req.user;

  const sql = `
    SELECT * FROM student WHERE dept_id = ? AND section = ?
`;

  let students = await queryParamPromise(sql, [class_sec[0], class_sec[1]]);
  for (students of students) {
    const status = await queryParamPromise(
      'SELECT status FROM attendance WHERE c_id = ? AND s_id = ? AND date = ?',
      [c_id, students.s_id, date]
    );
    if (status.length !== 0) {
      students.status = status[0].status;
    } else {
      students.status = 0;
    }
  }

  return res.render('Staff/attendance', {
    studentData: students,
    courseId: c_id,
    date,
    page_name: 'attendance',
  });
};

exports.postAttendance = async (req, res, next) => {
  const { date, courseId, ...students } = req.body;
  let attedData = await queryParamPromise(
    'SELECT * FROM attendance WHERE date = ? AND c_id = ?',
    [date, courseId]
  );

  if (attedData.length === 0) {
    for (const s_id in students) {
      const isPresent = students[s_id];
      await queryParamPromise('insert into attendance set ?', {
        s_id: s_id,
        date: date,
        c_id: courseId,
        status: isPresent == 'True' ? 1 : 0,
      });
    }
    req.flash('success_msg', 'Attendance done successfully');
    return res.redirect('/staff/student-attendance');
  }

  for (const s_id in students) {
    const isPresent = students[s_id] === 'True' ? 1 : 0;
    await queryParamPromise(
      'update attendance set status = ? WHERE s_id = ? AND date = ? AND c_id = ?',
      [isPresent, s_id, date, courseId]
    );
  }

  req.flash('success_msg', 'Attendance updated successfully');
  return res.redirect('/staff/student-attendance');
};

exports.getStudentReport = async (req, res, next) => {
  const sql1 = 'SELECT * FROM staff WHERE st_id = ?';
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);

  const sql3 =
    'SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id ORDER BY cl.semester;';
  const classData = await queryParamPromise(sql3, [data[0].st_id]);

  res.render('Staff/selectClass', {
    user: data[0],
    classData,
    btnInfo: 'Students',
    page_name: 'stu-report',
  });
};

exports.selectClassReport = async (req, res, next) => {
  const sql1 = 'SELECT * FROM staff WHERE st_id = ?';
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);

  const sql3 =
    'SELECT cl.class_id, cl.section, cl.semester, cl.c_id, co.name FROM class AS cl, course AS co WHERE st_id = ? AND co.c_id = cl.c_id ORDER BY cl.semester;';
  const classData = await queryParamPromise(sql3, [data[0].st_id]);

  res.render('Staff/selectClassReport', {
    user: data[0],
    classData,
    btnInfo: 'Check Status',
    page_name: 'cls-report',
  });
};

exports.getClassReport = async (req, res, next) => {
  const courseId = req.params.id;
  const staffId = req.user;
  const section = req.query.section;
  const classData = await queryParamPromise(
    'SELECT * FROM class WHERE c_id = ? AND st_id = ? AND section = ?',
    [courseId, staffId, section]
  );
  const sql1 = 'SELECT * FROM staff WHERE st_id = ?';
  const user = req.user;
  const data = await queryParamPromise(sql1, [user]);
  res.render('Staff/getClassReport', {
    user: data[0],
    classData,
    page_name: 'cls-report',
  });
};

exports.getLogout = (req, res, next) => {
  res.cookie('jwt', '', { maxAge: 1 });
  req.flash('success_msg', 'You are logged out');
  res.redirect('/staff/login');
};

// FORGOT PASSWORD
exports.getForgotPassword = (req, res, next) => {
  res.render('Staff/forgotPassword');
};

exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).render('Staff/forgotPassword');
  }

  let errors = [];

  const sql1 = 'SELECT * FROM staff WHERE email = ?';
  const results = await queryParamPromise(sql1, [email]);
  if (!results || results.length === 0) {
    errors.push({ msg: 'That email is not registered!' });
    return res.status(401).render('Staff/forgotPassword', {
      errors,
    });
  }

  const token = jwt.sign(
    { _id: results[0].st_id },
    process.env.RESET_PASSWORD_KEY,
    { expiresIn: '20m' }
  );

  const data = {
    from: 'noreplyCMS@mail.com',
    to: email,
    subject: 'Reset Password Link',
    html: `<h2>Please click on given link to reset your password</h2>
                <p><a href="${process.env.URL}/staff/resetpassword/${token}">Reset Password</a></p>
                <hr>
                <p><b>The link will expire in 20m!</b></p>
              `,
  };

  const sql2 = 'UPDATE staff SET resetLink = ? WHERE email = ?';
  db.query(sql2, [token, email], (err, success) => {
    if (err) {
      errors.push({ msg: 'Error In ResetLink' });
      res.render('Staff/forgotPassword', { errors });
    } else {
      mg.messages().send(data, (err, body) => {
        if (err) throw err;
        else {
          req.flash('success_msg', 'Reset Link Sent Successfully!');
          res.redirect('/staff/forgot-password');
        }
      });
    }
  });
};

exports.getResetPassword = (req, res, next) => {
  const resetLink = req.params.id;
  res.render('Staff/resetPassword', { resetLink });
};

exports.resetPassword = (req, res, next) => {
  const { resetLink, password, confirmPass } = req.body;

  let errors = [];

  if (password !== confirmPass) {
    req.flash('error_msg', 'Passwords do not match!');
    res.redirect(`/staff/resetpassword/${resetLink}`);
  } else {
    if (resetLink) {
      jwt.verify(resetLink, process.env.RESET_PASSWORD_KEY, (err, data) => {
        if (err) {
          errors.push({ msg: 'Token Expired!' });
          res.render('Staff/resetPassword', { errors });
        } else {
          const sql1 = 'SELECT * FROM staff WHERE resetLink = ?';
          db.query(sql1, [resetLink], async (err, results) => {
            if (err || results.length === 0) {
              throw err;
            } else {
              let hashed = await bcrypt.hash(password, 8);

              const sql2 = 'UPDATE staff SET password = ? WHERE resetLink = ?';
              db.query(sql2, [hashed, resetLink], (errorData, retData) => {
                if (errorData) {
                  throw errorData;
                } else {
                  req.flash(
                    'success_msg',
                    'Password Changed Successfully! Login Now'
                  );
                  res.redirect('/staff/login');
                }
              });
            }
          });
        }
      });
    } else {
      errors.push({ msg: 'Authentication Error' });
      res.render('Staff/resetPassword', { errors });
    }
  }
};





// Function to fetch courses based on department and semester
exports.getCourses = async (req, res) => {
  const { dept_id, semester } = req.query;

  try {
    // Check if both department and semester are provided
    if (!dept_id || !semester) {
      return res.status(400).json({ error: 'Both department and semester are required' });
    }

    console.log(`Fetching courses for department: ${dept_id}, semester: ${semester}`);

    // Fetch courses based on the department and semester
    const sql = 'SELECT c_id, name FROM course WHERE dept_id = ? AND semester = ?';
    const courses = await queryParamPromise(sql, [dept_id, semester]);

    console.log('Fetched courses:', courses);

    // Return the courses as JSON
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);

    // Handle the error and send an appropriate JSON response
    res.status(500).json({ error: 'Error fetching courses', details: error.message });
  }
};




// Route to render the "Add Result" page
exports.getAddResult = async (req, res) => {
  try {
    // Fetch department names for populating the dropdown
    const departments = await zeroParamPromise('SELECT dept_id, d_name FROM department');

    // Get flash messages from the session
    const errorFlash = req.flash('error');
    const successFlash = req.flash('success');

    // Render the page with department data and flash messages
    res.render('Staff/addResult', {
      page_name: 'results',
      departments,
      errorFlash,
      successFlash,
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    req.flash('error', 'Internal Server Error');
    res.redirect('/staff/addResult');
  }
};


exports.postAddResult = async (req, res) => {
  const { semester, course, department } = req.body;

  // Check if Excel file is uploaded
  if (!req.files || !req.files.excelFile) {
    return handleErrors(req, res, 'Error: Excel file is required for submission');
  }

  // Handle Excel file upload
  const file = req.files.excelFile;

  // Check if all required fields are provided
  if (!semester || !course || !department) {
    return handleErrors(req, res, 'Error: All fields are required for submission');
  }

  try {
    // Fetch department names for populating the dropdown
    const departments = await zeroParamPromise('SELECT dept_id, d_name FROM department');

    // Check if the selected department is valid
    const selectedDepartment = departments.find(dep => dep.dept_id === department);
    if (!selectedDepartment) {
      return handleErrors(req, res, 'Error: Invalid department selected');
    }

    // Parse the Excel file
    const workbook = XLSX.read(file.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Initialize an array to store the data
    const data = [];

    // Initialize an array to store errors related to missing student records
    const missingStudentErrors = [];

    for (let rowNum = 2; ; rowNum++) {
      const rollNumberCell = worksheet[`A${rowNum}`];
      const s_nameCell = worksheet[`B${rowNum}`];
      const marksCell = worksheet[`C${rowNum}`];

      // Break if any of the cells is undefined or null
      if (
        rollNumberCell === undefined || rollNumberCell.v == null ||
        s_nameCell === undefined || s_nameCell.v == null ||
        marksCell === undefined || marksCell.v == null
      ) {
        // If any of the cells is empty, break out of the loop
        break;
      }

      // Extract values from the cells
      const rollNo = rollNumberCell.v;
      const name = s_nameCell.v;
      const gpa = marksCell.v;

      if (semester && department && course && rollNo && gpa && name) {
        const sql2 = 'SELECT s_id FROM student WHERE rollNumber = ? AND dept_id = ?';
        const sidResult = await queryParamPromise(sql2, [rollNo, department]);

        // Check if the query returned any results
        if (sidResult.length > 0) {
          const sid = sidResult[0].s_id;

          data.push({ department, course, rollNo, name, gpa, sid, semester });
        } else {
          console.error(`Error: s_id not found for rollNo: ${rollNo}`);
          const errorMessage = `Student not found for rollNo: ${rollNo} in the selected department`;
          req.flash('error', errorMessage);
          missingStudentErrors.push(`Error: ${errorMessage}`);
        }
      } else {
        return handleErrors(req, res, 'Error: One or more values are null in the Excel file');
      }
    }

    if (missingStudentErrors.length > 0) {
      req.flash('missingStudentErrors', missingStudentErrors);
      return res.redirect('/staff/addResult');
    }

    // Continue with the database insertion logic
    try {
      // Start a transaction
      await queryParamPromise('START TRANSACTION');

      // Iterate through the data array and insert/update each record into the database
      for (const { department, sid, semester, course, rollNo, gpa } of data) {
        // Check for existing records for the same department, semester, subject, and rollNumber
        const existingRecordsSql =
          'SELECT * FROM result WHERE dept_id = ? AND semester = ? AND c_id = ? AND rollNumber = ?';
        const existingRecords = await queryParamPromise(existingRecordsSql, [department, semester, course, rollNo]);

        // If there are existing records, send a confirmation message to the client
        if (existingRecords.length > 0) {
          // Customize the confirmation message based on your needs
          const confirmationMessage = `Data already exists for the same department, semester, course, and rollNumber. Do you want to update it?`;

          // Send confirmation message to the client
          return res.status(409).json({ confirmationMessage, existingData: existingRecords[0] });
        }

        // Add your logic to save the results to the database
        const insertSql = 'INSERT INTO result (dept_id, s_id, semester, c_id, rollNumber, marks) VALUES (?, ?, ?, ?, ?, ?)';
        await queryParamPromise(insertSql, [department, sid, semester, course, rollNo, gpa]);
      }

      // Commit the transaction
      await queryParamPromise('COMMIT');

      // Set success flash message
      req.flash('success', 'Success: Results added successfully');
      res.redirect('/staff/addResult');
      // Redirect to the addResult page
    } catch (error) {
      // Rollback the transaction in case of an error
      await queryParamPromise('ROLLBACK');

      // Log the error details
      console.error('Error processing results:', error);

      // Handle the error using the centralized error handling function
      return handleErrors(req, res, 'Error: Processing results. Please try again.', error);
    }
  } catch (error) {
    // Log the error details
    console.error('Error: Parsing Excel file or inserting into the database:', error);

    // Handle the error using the centralized error handling function
    return handleErrors(req, res, 'Error: Parsing Excel file or inserting into the database. Please try again.', error);
  }
};

exports.getResult = async (req, res, next) => {
  try {
    const sql = `
      SELECT s.s_name AS student_name, s.rollNumber AS student_rollNumber,
             d.d_name AS department, c.name AS course_name, r.semester AS semester, r.marks
      FROM result AS r
      JOIN student AS s ON r.s_id = s.s_id
      JOIN course AS c ON r.c_id = c.c_id
      JOIN department AS d ON r.dept_id = d.dept_id
    `;

    const results = await zeroParamPromise(sql);
    res.render("Staff/getResult", {
      data: results,
      page_name: "results",
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    // Pass an error message to the UI
    res.render("Staff/getResult", {
      error: "Error fetching results. Please try again later.",
      page_name: "results",
    });
  }
};
