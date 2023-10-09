const express = require('express');
const controller = require('../controllers/staff');
const { requireAuth, forwardAuth } = require('../middlewares/staffAuth');
const { getCourses, getAddResult, postAddResult } = require('../controllers/staff');
const { handleErrors } = require('../middlewares/errorHandlers');

const router = express.Router();

// login page
router.get('/login', forwardAuth, controller.getLogin);
router.post('/login', controller.postLogin);

router.get('/dashboard', requireAuth, controller.getDashboard);
router.get('/profile', requireAuth, controller.getProfile);
router.get('/logout', requireAuth, controller.getLogout);

router.get('/student-attendance', requireAuth, controller.getAttendance);
router.post('/student-attendance/class/:id', requireAuth, controller.postAttendance);
router.get('/timetable', requireAuth, controller.getTimeTable);
router.post('/student-attendance', requireAuth, controller.markAttendance);
router.get('/student-report', requireAuth, controller.getStudentReport);
router.get('/class-report', requireAuth, controller.selectClassReport);
router.get('/class-report/class/:id', requireAuth, controller.getClassReport);

// 1.5 FORGET PASSWORD
router.get('/forgot-password', forwardAuth, controller.getForgotPassword);
router.put('/forgot-password', controller.forgotPassword);

// 1.6 RESET PASSWORD
router.get('/resetpassword/:id', forwardAuth, controller.getResetPassword);
router.put('/resetpassword', controller.resetPassword);

// 3.5 Add Result routes
router.get('/addResult', requireAuth, getAddResult);
router.post('/addResult', requireAuth, postAddResult);

//getallresult
router.get('/getresult', requireAuth, controller.getResult);


// Define a route handler for fetching courses
router.get('/getCourses', getCourses);

// Define a route handler for fetching confirmation
router.get('/addResult/confirmation', async (req, res) => {
  try {
    // Perform any necessary logic to determine if confirmation is required
    const confirmationRequired = true; // Replace with your actual logic

    // Send a JSON response
    res.json({ confirmationRequired });
  } catch (error) {
    // Log the error details
    console.error('Error fetching confirmation:', error);

    // Handle the error using the centralized error handling function
    handleErrors(req, res, 'Error fetching confirmation. Please try again.', error);
  }
});

// Export the router
module.exports = router;
