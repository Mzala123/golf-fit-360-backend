const pool = require('../model/db');
const sendJSONresponse = require('../services/response')


module.exports.createFittingRequest = async(req, res)=>{

    if(!req.body.userId || !req.body.fittingServiceCategory || !req.body.fittingScheduleDate || !req.body.fittingScheduleTime){
        return sendJSONresponse(res, 400, {message:"Fill in all required fields"})
    }


    let{userId, fittingServiceCategory, status, fittingScheduleDate, fittingScheduleTime, comments} = req.body

    status = "SUBMITTED"

    const tasksList = [
        "Acknowledge Request",
        "Schedule Swing Analysis",
        "Swing Analysis Completed",
        "Fitting Scheduled",
        "Fitting Completed"
    ]



    try{

        const hasFittingRequest = await pool.query(`SELECT * FROM fitting_requests WHERE userId=$1 
            AND status NOT IN ('COMPLETED', 'CANCELLED')`,[userId])

        if(hasFittingRequest.rows.length > 0){
            return sendJSONresponse(res, 400, {message:"You have an ongoing fitting request"})
        }    

        await pool.query('BEGIN')

        const insertFittingRequest = `
          INSERT INTO fitting_requests (userid, fittingservicecategory, status, fittingscheduledate, fittingscheduletime, comments)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING fittingId 
        `;

        const fittingRequestRecord = await pool.query(insertFittingRequest, [userId, fittingServiceCategory, status, fittingScheduleDate, fittingScheduleTime, comments])
        const fittingId = fittingRequestRecord.rows[0].fittingid
     
        const fittingTaskStatus = "PENDING"

        for (const [index, task] of tasksList.entries()) {
            const insertFittingTask = `
              INSERT INTO fitting_tasks (fittingid, taskname, fittingtaskstatus, index)
              VALUES ($1, $2, $3, $4);
            `;
      
            await pool.query(insertFittingTask, [fittingId, task, fittingTaskStatus, index + 1]);
          }
      
          await pool.query("COMMIT")

          return sendJSONresponse(res, 201, {"message":"Fitting request created successfully"})

    }catch(err){
          await pool.query("ROLLBACK")
          return  sendJSONresponse(res, 400, {message:"Failed to create fitting request", error: err.message ||  err})
    }
}

module.exports.performFittingTask = (req, res)=>{

}



