const validateSignup = (req, res, next) => {
  const { name, phoneNumber, password } = req.body;

  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!phoneNumber || !/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
    errors.push('Please enter a valid phone number');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { phoneNumber, password } = req.body;

  const errors = [];

  if (!phoneNumber || !/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
    errors.push('Please enter a valid phone number');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateOTP = (req, res, next) => {
  const { otp } = req.body;

  const errors = [];

  if (!otp || !/^\d{6}$/.test(otp)) {
    errors.push('OTP must be a 6-digit number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateRide = (req, res, next) => {
  const { source, destination, date, time, travelMode } = req.body;

  const errors = [];

  if (!source || !source.name || !source.coordinates) {
    errors.push('Source location is required');
  }

  if (!destination || !destination.name || !destination.coordinates) {
    errors.push('Destination location is required');
  }

  if (!date) {
    errors.push('Date is required');
  }

  if (!time) {
    errors.push('Time is required');
  }

  if (!travelMode || !['car', 'auto', 'public'].includes(travelMode)) {
    errors.push('Valid travel mode is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateAnnouncement = (req, res, next) => {
  const { destination, date, time } = req.body;

  const errors = [];

  if (!destination || !destination.name || !destination.coordinates) {
    errors.push('Destination location is required');
  }

  if (!date) {
    errors.push('Date is required');
  }

  if (!time) {
    errors.push('Time is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateOTP,
  validateRide,
  validateAnnouncement
};
