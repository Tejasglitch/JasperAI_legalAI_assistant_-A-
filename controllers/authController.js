const User = require('../models/User');
const crypto = require('crypto');
const { generateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Load preloaded verification data
const preloadedDataPath = path.join(__dirname, '../../data/preloaded_data.json');
let preloadedData = { aadhaar: {}, bci: {}, gov: {} };

try {
  preloadedData = JSON.parse(fs.readFileSync(preloadedDataPath, 'utf8'));
} catch (error) {
  console.error('Error loading preloaded verification data:', error);
}

/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      phone,
      passwordHash: password, // will be hashed by pre-save hook
      role: 'public'
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: user.userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * User login
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is suspended or inactive' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      // Increment failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLogin = Date.now();
      
      // If too many failed attempts, suspend account
      if (user.failedLoginAttempts >= 5) {
        user.status = 'suspended';
        await user.save();
        return res.status(403).json({ 
          success: false, 
          message: 'Account suspended due to too many failed login attempts' 
        });
      }
      
      await user.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Reset failed login attempts
    user.failedLoginAttempts = 0;
    user.lastLogin = Date.now();
    await user.save();
    
    // Generate token
    const token = generateToken(user.userId, user.role);
    
    // Send response based on user verification status
    if (!user.isVerified) {
      // For public users who need to verify email/Aadhaar
      return res.status(200).json({
        success: true,
        token,
        userType: 'public',
        verified: false,
        message: 'Login successful, verification required',
        userId: user.userId
      });
    }
    
    res.status(200).json({
      success: true,
      token,
      userType: user.role,
      verified: true,
      message: 'Login successful',
      userId: user.userId,
      name: user.name
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify email with OTP
 * @route POST /api/auth/verify/email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.body.userId || req.user?.userId;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }
    
    // In a real implementation, we would verify the OTP against one sent to the user's email
    // For this project, we'll simulate verification with any 6-digit OTP
    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // Find user and update email verification status
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Mark email as verified
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify Aadhaar
 * @route POST /api/auth/verify/aadhaar
 */
exports.verifyAadhaar = async (req, res) => {
  try {
    const { aadhaar, otp } = req.body;
    const userId = req.body.userId || req.user?.userId;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }
    
    // Validate Aadhaar format
    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      return res.status(400).json({ success: false, message: 'Invalid Aadhaar number' });
    }
    
    // In a real implementation, we would verify with the actual Aadhaar API
    // For this project, we'll check against preloaded data
    if (!preloadedData.aadhaar[aadhaar]) {
      return res.status(400).json({ success: false, message: 'Aadhaar verification failed' });
    }
    
    // Validate OTP (simulated)
    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    // Find user and update Aadhaar verification status
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update user with Aadhaar info
    user.aadhaarNumber = aadhaar;
    user.isVerified = true;
    await user.save();
    
    // Generate new token with updated information
    const token = generateToken(user.userId, user.role);
    
    res.status(200).json({
      success: true,
      message: 'Aadhaar verified successfully',
      token,
      verified: true
    });
  } catch (error) {
    console.error('Aadhaar verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify legal professional passkey
 * @route POST /api/auth/verify/legal-passkey
 */
exports.verifyLegalPasskey = async (req, res) => {
  try {
    const { passkey } = req.body;
    
    // In a real implementation, we would verify with a secure database
    // For this project, we'll check against preloaded data
    if (!passkey || !preloadedData.passkeys?.legal) {
      return res.status(400).json({ success: false, message: 'Invalid passkey' });
    }
    
    // Check if passkey matches
    if (passkey !== preloadedData.passkeys.legal) {
      return res.status(401).json({ success: false, message: 'Invalid passkey' });
    }
    
    // Create a temporary token for the verification process
    const tempToken = generateToken('legal-temp', 'legal');
    
    res.status(200).json({
      success: true,
      message: 'Passkey verified successfully',
      token: tempToken
    });
  } catch (error) {
    console.error('Legal passkey verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify legal professional credentials
 * @route POST /api/auth/verify/legal-credentials
 */
exports.verifyLegalCredentials = async (req, res) => {
  try {
    const { bciId, legalId } = req.body;
    
    // Validate IDs
    if (!bciId || !legalId) {
      return res.status(400).json({ success: false, message: 'BCI ID and Legal ID required' });
    }
    
    // In a real implementation, we would verify with the actual BCI database
    // For this project, we'll check against preloaded data
    const bciRecord = preloadedData.bci[bciId];
    
    if (!bciRecord) {
      return res.status(401).json({ success: false, message: 'Invalid BCI ID' });
    }
    
    if (bciRecord.legalId !== legalId) {
      return res.status(401).json({ success: false, message: 'BCI ID and Legal ID do not match' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Legal credentials verified successfully',
      name: bciRecord.name
    });
  } catch (error) {
    console.error('Legal credentials verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify legal professional hidden ID
 * @route POST /api/auth/verify/legal-hidden
 */
exports.verifyLegalHidden = async (req, res) => {
  try {
    const { hiddenId, bciId, legalId } = req.body;
    
    // Validate IDs
    if (!hiddenId || !bciId || !legalId) {
      return res.status(400).json({ success: false, message: 'All IDs required' });
    }
    
    // In a real implementation, we would verify with the actual BCI database
    // For this project, we'll check against preloaded data
    const bciRecord = preloadedData.bci[bciId];
    
    if (!bciRecord) {
      return res.status(401).json({ success: false, message: 'Invalid BCI ID' });
    }
    
    if (bciRecord.legalId !== legalId) {
      return res.status(401).json({ success: false, message: 'BCI ID and Legal ID do not match' });
    }
    
    if (bciRecord.hiddenId !== hiddenId) {
      return res.status(401).json({ success: false, message: 'Invalid Hidden ID' });
    }
    
    // Create or update user
    let user = await User.findOne({ bciId });
    
    if (!user) {
      // Create new user
      user = new User({
        name: bciRecord.name,
        email: bciRecord.email,
        passwordHash: crypto.randomBytes(16).toString('hex'), // Random password
        role: 'legal',
        bciId,
        isVerified: true
      });
    } else {
      // Update existing user
      user.isVerified = true;
      user.lastLogin = Date.now();
    }
    
    await user.save();
    
    // Generate token
    const token = generateToken(user.userId, user.role);
    
    res.status(200).json({
      success: true,
      message: 'Legal professional verified successfully',
      token,
      userId: user.userId,
      userType: 'legal',
      name: user.name
    });
  } catch (error) {
    console.error('Legal hidden ID verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify judiciary code
 * @route POST /api/auth/verify/judiciary-code
 */
exports.verifyJudiciaryCode = async (req, res) => {
  try {
    const { secretCode } = req.body;
    
    // In a real implementation, we would verify with a secure database
    // For this project, we'll check against preloaded data
    if (!secretCode || !preloadedData.passkeys?.judiciary) {
      return res.status(400).json({ success: false, message: 'Invalid secret code' });
    }
    
    // Check if code matches
    if (secretCode !== preloadedData.passkeys.judiciary) {
      return res.status(401).json({ success: false, message: 'Invalid secret code' });
    }
    
    // Create a temporary token for the verification process
    const tempToken = generateToken('judiciary-temp', 'judiciary');
    
    res.status(200).json({
      success: true,
      message: 'Secret code verified successfully',
      token: tempToken
    });
  } catch (error) {
    console.error('Judiciary code verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify judiciary credentials
 * @route POST /api/auth/verify/judiciary-credentials
 */
exports.verifyJudiciaryCredentials = async (req, res) => {
  try {
    const { officialId, secretId } = req.body;
    
    // Validate IDs
    if (!officialId || !secretId) {
      return res.status(400).json({ success: false, message: 'Official ID and Secret ID required' });
    }
    
    // In a real implementation, we would verify with the actual government database
    // For this project, we'll check against preloaded data
    const govRecord = preloadedData.gov[officialId];
    
    if (!govRecord) {
      return res.status(401).json({ success: false, message: 'Invalid Official ID' });
    }
    
    if (govRecord.secretId !== secretId) {
      return res.status(401).json({ success: false, message: 'Official ID and Secret ID do not match' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Judiciary credentials verified successfully',
      name: govRecord.name
    });
  } catch (error) {
    console.error('Judiciary credentials verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify judiciary classified ID
 * @route POST /api/auth/verify/judiciary-classified
 */
exports.verifyJudiciaryClassified = async (req, res) => {
  try {
    const { classifiedId, officialId, secretId } = req.body;
    
    // Validate IDs
    if (!classifiedId || !officialId || !secretId) {
      return res.status(400).json({ success: false, message: 'All IDs required' });
    }
    
    // In a real implementation, we would verify with the actual government database
    // For this project, we'll check against preloaded data
    const govRecord = preloadedData.gov[officialId];
    
    if (!govRecord) {
      return res.status(401).json({ success: false, message: 'Invalid Official ID' });
    }
    
    if (govRecord.secretId !== secretId) {
      return res.status(401).json({ success: false, message: 'Official ID and Secret ID do not match' });
    }
    
    if (govRecord.classifiedId !== classifiedId) {
      return res.status(401).json({ success: false, message: 'Invalid Classified ID' });
    }
    
    // Create or update user
    let user = await User.findOne({ govId: officialId });
    
    if (!user) {
      // Create new user
      user = new User({
        name: govRecord.name,
        email: govRecord.email,
        passwordHash: crypto.randomBytes(16).toString('hex'), // Random password
        role: 'judiciary',
        govId: officialId,
        isVerified: true
      });
    } else {
      // Update existing user
      user.isVerified = true;
      user.lastLogin = Date.now();
    }
    
    await user.save();
    
    // Generate token
    const token = generateToken(user.userId, user.role);
    
    res.status(200).json({
      success: true,
      message: 'Judiciary member verified successfully',
      token,
      userId: user.userId,
      userType: 'judiciary',
      name: user.name
    });
  } catch (error) {
    console.error('Judiciary classified ID verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get user profile
 * @route GET /api/auth/me
 */
exports.getProfile = async (req, res) => {
  try {
    // Get user from middleware
    const user = req.user;
    
    // Remove sensitive data
    const userProfile = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      created: user.created,
      lastLogin: user.lastLogin,
      profileData: user.profileData,
      settings: user.settings
    };
    
    res.status(200).json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/me
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profileData, settings } = req.body;
    
    // Find user
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profileData) user.profileData = { ...user.profileData, ...profileData };
    if (settings) user.settings = { ...user.settings, ...settings };
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Change password
 * @route PUT /api/auth/me/password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    }
    
    // Find user
    const user = await User.findOne({ userId: req.user.userId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Update password
    user.passwordHash = newPassword; // will be hashed by pre-save hook
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiry
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // In a real implementation, send email with reset link
    // For this project, just return the token
    
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    // Hash token from request
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Find user
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    
    // Update password
    user.passwordHash = newPassword; // will be hashed by pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Logout
 * @route POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    // In a real implementation with refresh tokens, we would blacklist the token
    // For this project, just return success
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};