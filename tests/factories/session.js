const Buffer = require("safe-buffer").Buffer;
const Keygrip = require("keygrip");
const keys = require("../../config/keys");

module.exports = (user) => {
  const sessionString = {
    passport: {
      user: user._id,
    },
  };

  const session = Buffer.from(JSON.stringify(sessionString)).toString("base64");
  const keygrip = new Keygrip([keys.cookieKey]);
  const sessionSig = keygrip.sign("session=" + session);

  return { session, sessionSig };
};
