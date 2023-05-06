const { clearCache } = require("../services/cache");

module.exports = async function (req, res, next) {
  await next();

  await clearCache(req.user.id);
};
