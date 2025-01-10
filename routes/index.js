var express = require('express');
var router = express.Router();

const authCtrl = require("../controllers/auth")
const messageCtrl = require("../controllers/message")
const fittingCtrl = require("../controllers/fitting")
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

// Fitting Request apis 

router.post('/fittingRequest', fittingCtrl.createFittingRequest)
router.get('/fittingRequest', fittingCtrl.getListFittingRequests)
router.get('/fittingRequest/:fittingId', fittingCtrl.readOneFittingRequest)
router.get('/fittingRequestTasks/:fittingId', fittingCtrl.readOneFittingRequestTasks)
router.get('/fittingRequestSchedules', fittingCtrl.fittingRequestSchedules)
router.get('/fittingRequestHistory', fittingCtrl.fittingRequestHistory)

router.put('/performFittingTask/:taskId', fittingCtrl.performFittingTask)

router.get('/readCustomerFittings/:userId',fittingCtrl.readCustomerFittings)
router.get('/viewFittingProgressList/:userId', fittingCtrl.viewFittingProgressList)
router.get('/viewFittingTaskProgressList/:fittingId', fittingCtrl.viewFittingTaskProgressList)

router.get('/getAvailableFittingRequestDateTime', fittingCtrl.getAvailableFittingRequestDateTime)

router.put('/cancelFittingRequestsTasks/:fittingId', fittingCtrl.cancelFittingRequestsTasks)

module.exports = router;
