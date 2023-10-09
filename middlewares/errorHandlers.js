// middlewares/errorHandlers.js

// Centralized error handling function
const handleErrors = (req, res, errorMessage, errorDetails) => {
    console.error(errorMessage);
  
    // Log more details about the error
    if (errorDetails) {
      console.error(errorDetails);
    }
  
    // Set error flash message
    req.flash('error', errorMessage);
  
    // Redirect to the addResult page
    res.redirect('/staff/addResult');
  };
  
  module.exports = { handleErrors };
  