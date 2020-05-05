const crypto = require('crypto')

module.exports = (size = 21) => {  
  return crypto
    .randomBytes(size)
    .toString('base64')
    .slice(0, size)
}