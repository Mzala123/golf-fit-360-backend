var express = require('express');
var router = express.Router();

const authCtrl = require("../controllers/auth")

// users creation apis
router.post('/registerAdmin', authCtrl.registerAdmin)
router.post('/registerCustomer', authCtrl.registerCustomer)
router.post('/login', authCtrl.login)
//End of users 

//customer apis
router.get('/user_customer', authCtrl.getCustomerList)
router.get('/user_customer/:customerId', authCtrl.getOneCustomer)
router.put('/user_customer/:customerId', authCtrl.updateCustomer)
//End of user apis


module.exports = router;
