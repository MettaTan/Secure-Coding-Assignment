const bcrypt = require('bcrypt');

const password = "abc123"
const saltRounds = 10

bcrypt.genSalt(saltRounds, function (err, salt) {
  if (err) {
    throw err
  } else {
    console.log(salt)
    bcrypt.hash(password, salt, function(err, hash) {
      if (err) {
        throw err
      } else {
        console.log(hash)
      }
    })
  }
})