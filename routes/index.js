var express = require('express');
var router = express.Router();

var {expressjwt: jwt} = require("express-jwt")

var auth = jwt({
       secret: process.env.JWT_SECRET,
       algorithms: ['HS256'],
       requestProperty: "auth"
    }
) 

const authCtrl = require("../controllers/auth")
const messageCtrl = require("../controllers/message")
const fittingCtrl = require("../controllers/fitting")
// users creation apis
router.post('/registerAdmin', authCtrl.registerAdmin)
router.post('/registerCustomer', authCtrl.registerCustomer)
router.post('/login', authCtrl.login)
//End of users 

//customer apis
router.get('/customers', auth, authCtrl.getCustomerList)
router.get('/customers/:customerId', auth,  authCtrl.getOneCustomer)
router.put('/customers/:customerId', auth, authCtrl.updateCustomer)
router.delete('/customers/:customerId', auth, authCtrl.deleteCustomer)
//End of user apis

//Golf club message apis
router.post('/golfClubMessage', messageCtrl.createGolfClubMessage)
router.get('/readGettingStartedMessage', messageCtrl.readGettingStartedMessage)
router.get('/golfClubMessage/:messageId', messageCtrl.readOneGolfClubMessage)
router.put('/golfClubMessage/:messageId', messageCtrl.updateGolfClubMessage)

//End of golf club message apis

// Fitting Request apis 

router.post('/fittingRequest', auth, fittingCtrl.createFittingRequest)
router.get('/fittingRequest',auth, fittingCtrl.getListFittingRequests)
router.get('/fittingRequest/:fittingId',auth, fittingCtrl.readOneFittingRequest)
router.get('/fittingRequestTasks/:fittingId',auth, fittingCtrl.readOneFittingRequestTasks)
router.get('/fittingRequestSchedules',auth, fittingCtrl.fittingRequestSchedules)
router.get('/fittingRequestHistory',auth, fittingCtrl.fittingRequestHistory)

router.put('/performFittingTask/:taskId', fittingCtrl.performFittingTask)

router.get('/readCustomerFittings/:userId',fittingCtrl.readCustomerFittings)
router.get('/viewFittingProgressList/:userId', fittingCtrl.viewFittingProgressList)
router.get('/viewFittingTaskProgressList/:fittingId', fittingCtrl.viewFittingTaskProgressList)

router.get('/getAvailableFittingRequestDateTime', fittingCtrl.getAvailableFittingRequestDateTime)

router.put('/cancelFittingRequestsTasks/:fittingId', fittingCtrl.cancelFittingRequestsTasks)

//router.get('/getUserDetails',auth,fittingCtrl.getUser)


module.exports = router;
