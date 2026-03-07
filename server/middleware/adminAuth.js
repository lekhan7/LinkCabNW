const adminAuth = (req, res, next) => {
  console.log(`AdminAuth check - User: ${req.user?.id}, Email: ${req.user?.email}, Role: ${req.user?.role}`);
  
  if (!req.user) {
    console.log('❌ AdminAuth failed: No user object found');
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  if (req.user.email !== "admin@gmail.com" && req.user.email !== "ktkarumbaiah@gmail.com") {
    console.log(`❌ AdminAuth failed: User ${req.user.email} is not an admin`);
    return res.status(403).json({
      success: false,
      message: `Access denied. Current role: ${req.user.role}. Admin privileges required.`
    });
  }

  console.log(`✅ AdminAuth passed: User ${req.user.email} is admin`);
  next();
};

module.exports = adminAuth;
