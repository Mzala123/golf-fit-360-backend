const pool = require('../model/db');
const sendJSONresponse = require('../services/response')

module.exports.createGolfClubMessage = async(req, res)=>{
    if (!req.body.message || !req.body.messageType) {
        return sendJSONresponse(res, 400, {
            message: "Fill in all required fields",
        });
    }

    const{message, messageType} = req.body
    try{

        const messageTypeExists = await pool.query("SELECT * FROM golf_club_messages WHERE messageType =$1", [messageType])
        if(messageTypeExists.length > 0){
            return sendJSONresponse(res, 400, {"message":"Golf club message of such type already exists"})
        }

        const inserMessageQuery = `
          INSERT INTO golf_club_messages (message, messagetype)
          VALUES ($1, $2)
        `
        await pool.query(inserMessageQuery, [message, messageType])
        sendJSONresponse(res, 201, {"message":"Golf club message created successfully"})
        
    }catch(err){
        sendJSONresponse(res, 400, {
            message:"Failed to created getting started message",
            error: err.message || err
        })
    }

}

module.exports.updateGolfClubMessage = (req, res)=>{
    const messageId= req.params.messageId
    if (!req.body.message) {
        return sendJSONresponse(res, 400, {
            message: "Fill in all required fields",
        });
    }
     const {message} = req.body
   
       pool.query("UPDATE golf_club_messages SET message=$1 WHERE messageId=$2",
        [
            message,
            messageId
        ]).then((response)=>{
            sendJSONresponse(res, 200, {message:"Golf club record updated successfully"})
        }).catch((err)=>{
            sendJSONresponse(res, 400, {message:"Failed to update golf club record",err})
        })
}

module.exports.readGettingStartedMessage = (req, res)=>{
    const messageType = "Getting Started"
    pool.query("SELECT * FROM golf_club_messages WHERE messagetype=$1",
        [
            messageType
        ]).then((response)=>{
            sendJSONresponse(res, 200, response.rows[0])
        }).catch((err)=>{
            sendJSONresponse(res, 400, {"message":"No such message with this message type "+err})
        })
}

module.exports.readOneGolfClubMessage = (req, res)=>{
     const messageId = req.params.messageId
     pool.query("SELECT * FROM golf_club_messages WHERE messageId=$1",
        [
            messageId
        ]).then((response)=>{
            sendJSONresponse(res, 200, response.rows[0])
        }).catch((err)=>{
            sendJSONresponse(res, 400, {"message":"No such message with this message Id "+err})
        })
}

