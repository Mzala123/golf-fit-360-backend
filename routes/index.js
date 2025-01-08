var express = require('express');
var router = express.Router();

const authCtrl = require("../controllers/auth")
const messageCtrl = require("../controllers/message")
// users creation apis
router.post('/registerAdmin', authCtrl.registerAdmin)
router.post('/registerCustomer', authCtrl.registerCustomer)
router.post('/login', authCtrl.login)
//End of users 

//customer apis
router.get('/customers', authCtrl.getCustomerList)
router.get('/customers/:customerId', authCtrl.getOneCustomer)
router.put('/customers/:customerId', authCtrl.updateCustomer)
//End of user apis

//Golf club message apis
router.post('/golfClubMessage', messageCtrl.createGolfClubMessage)
router.get('/readGettingStartedMessage', messageCtrl.readGettingStartedMessage)
router.get('/golfClubMessage/:messageId', messageCtrl.readOneGolfClubMessage)
router.put('/golfClubMessage/:messageId', messageCtrl.updateGolfClubMessage)

//End of golf club message apis


module.exports = router;
