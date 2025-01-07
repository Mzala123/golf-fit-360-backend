var express = require('express');
var router = express.Router();

const authCtrl = require("../controllers/auth")


// users creation apis
router.post('/register', authCtrl.register)
router.post('/login', authCtrl.login)
//End of user apis


module.exports = router;
