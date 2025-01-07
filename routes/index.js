var express = require('express');
var router = express.Router();

const authCtrl = require("../controllers/auth")


// users creation apis
router.post('/register', authCtrl.register)
router.post('/login', authCtrl.login)

//customer list
router.get('/user_customer', authCtrl.getCustomerList)
router.get('/user_customer/:userId', authCtrl.getOneCustomer)
//End of user apis


module.exports = router;
