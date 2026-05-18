const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class AuthController {
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // 🔐 Проста перевірка (у продакшені - перевірка в БД)
      if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(
          { username, role: 'admin' },
          process.env.JWT_SECRET,
          { expiresIn: '2h' }
        );

        logger.info(`User ${username} logged in`);
        return res.json({ token });
      }

      return next(new ApiError(401, 'Invalid credentials'));
    } catch (error) {
      logger.error('Login error:', error);
      next(new ApiError(500, 'Authentication failed'));
    }
  }
}

module.exports = AuthController;