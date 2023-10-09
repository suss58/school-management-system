const express = require('express');
const controller = require('../controllers/student');
const { requireAuth, forwardAuth } = require('../middlewares/studentAuth');

const router = express.Router();

router.get('/login', forwardAuth, controller.getLogin);
router.post('/login', controller.postLogin);

router.get('/dashboard', requireAuth, controller.getDashboard);
router.get('/profile', requireAuth, controller.getProfile);

router.get('/logout', requireAuth, controller.getLogout);

// Forget Password
router.get('/forgot-password', forwardAuth, controller.getForgotPassword);
router.put('/forgot-password', controller.forgotPassword);

// Reset Password
router.get('/reset-password/:id', forwardAuth, controller.getResetPassword);
router.put('/reset-password', controller.resetPassword);

// Get the student result page
router.get('/result', requireAuth, controller.getDisplayResult);

// Fetch results for a specific semester
router.post('/display/result', requireAuth, controller.displaySemesterResult);

// router.post('/display/result', requireAuth, controller.DisplayResult);
module.exports = router;
