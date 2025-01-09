const { response } = require('express');
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

module.exports.getListFittingRequests = (req, res)=>{
     pool.query(`SELECT 
                fitting_requests.*, 
                customers.*, 
                TO_CHAR(fitting_requests.fittingscheduledate, 'YYYY-MM-DD') AS formatted_fittingscheduledate
                FROM 
                fitting_requests 
                LEFT JOIN 
                customers 
                ON 
                customers.userid = fitting_requests.userid  WHERE status NOT IN ('COMPLETED', 'CANCELLED')`)
     .then((response)=>{
        sendJSONresponse(res, 200, response.rows)
     }).catch((err)=>{
        sendJSONresponse(res, 401, err)
     })
}



module.exports.readOneFittingRequest = (req, res)=>{
    const fittingId = req.params.fittingId

    pool.query(`SELECT *, fitting_requests.userid FROM fitting_requests 
                LEFT JOIN customers ON customers.userid = fitting_requests.userid
                WHERE fitting_requests.fittingId = $1`,
                [
                    fittingId
                ]).then((response)=>{
                    sendJSONresponse(res, 200, response.rows[0])
                }).catch((err)=>{
                    sendJSONresponse(res, 401, err)
    })
}

module.exports.readOneFittingRequestTasks = (req, res)=>{
     const fittingId = req.params.fittingId
     
    pool.query(`SELECT fitting_tasks.*, CONCAT(customers.firstname,' ',customers.lastname) AS customer_name,
            fitting_requests.* FROM fitting_requests 
            LEFT JOIN customers ON customers.userid = fitting_requests.userid
            LEFT JOIN fitting_tasks ON fitting_tasks.fittingId = fitting_requests.fittingId
            WHERE fitting_requests.fittingId = $1 ORDER BY index`,
        [
            fittingId
        ]).then((response)=>{
            sendJSONresponse(res, 200, response.rows)
        }).catch((err)=>{
            sendJSONresponse(res, 401, err)
        })

}

module.exports.fittingRequestSchedules =  (req, res)=>{
    pool.query(`SELECT customers.firstname, customers.lastname,
        fitting_requests.* FROM fitting_requests 
        LEFT JOIN customers ON customers.userid = fitting_requests.userid
        WHERE fitting_requests.status IN ('COMPLETED', 'SCHEDULED')`)
    .then((response)=>{
    sendJSONresponse(res, 200, response.rows)
    }).catch((err)=>{
    sendJSONresponse(res, 401, err)
    })
}


module.exports.fittingRequestHistory = (req, res)=>{
    pool.query(`SELECT 
        fitting_requests.*, customers.*, TO_CHAR(fitting_requests.fittingscheduledate, 'YYYY-MM-DD') AS formatted_fittingscheduledate
        FROM fitting_requests 
        LEFT JOIN customers ON customers.userid = fitting_requests.userid`)
    .then((response)=>{
    sendJSONresponse(res, 200, response.rows)
    }).catch((err)=>{
    sendJSONresponse(res, 401, err)
    })
}

module.exports.performFittingTask =async(req, res)=>{
   const taskId = req.params.taskId

    if(!req.body.fittingId || !req.body.taskname){
        return sendJSONresponse(res, 400, {message:"Fill in all required fields"})
    }
    const{fittingId, taskname} = req.body

    if(taskname === 'Acknowledge Request' || taskname === 'Schedule Swing Analysis' || taskname === 'Swing Analysis Completed'){
       try{

        await pool.query("BEGIN")
        const idDone = 1
        const fittingtaskstatus = "COMPLETED"
        const fittingrequeststatus = "PREPPED"

        const fittingTaskUpdateQeury = `
           UPDATE fitting_tasks SET fittingtaskstatus=$1, isdone=$2
           WHERE fittingtaskid = $3
        `
        await pool.query(fittingTaskUpdateQeury,[fittingtaskstatus, idDone, taskId])

        const fittingRequestUpdateQuery = `
          UPDATE fitting_requests SET status=$1 WHERE fittingid = $2
        `
        await pool.query(fittingRequestUpdateQuery, [fittingrequeststatus, fittingId])

        await pool.query("COMMIT")
        
        sendJSONresponse(res, 200, {"message":`${taskname} task has been completed successfully`})

       }catch(err){
         await pool.query("ROLLBACK")
         sendJSONresponse(res, 400, {"message":`Failed to complete ${taskname} task`, err})
       }
       
    }else if(taskname === 'Fitting Scheduled'){

        try{

            await pool.query("BEGIN")
            const idDone = 1
            const fittingtaskstatus = "COMPLETED"
            const fittingrequeststatus = "SCHEDULED"
    
            const fittingTaskUpdateQeury = `
               UPDATE fitting_tasks SET fittingtaskstatus=$1, isdone=$2
               WHERE fittingtaskid = $3
            `
            await pool.query(fittingTaskUpdateQeury,[fittingtaskstatus, idDone, taskId])
    
            const fittingRequestUpdateQuery = `
              UPDATE fitting_requests SET status=$1 WHERE fittingid = $2
            `
            await pool.query(fittingRequestUpdateQuery, [fittingrequeststatus, fittingId])
    
            await pool.query("COMMIT")
            
            sendJSONresponse(res, 200, {"message":`${taskname} task has been completed successfully`})
    
           }catch(err){
             await pool.query("ROLLBACK")
             sendJSONresponse(res, 400, {"message":`Failed to complete ${taskname} task`, err})
           }

        
    }else if(taskname === 'Fitting Completed'){

        try{

            await pool.query("BEGIN")
            const idDone = 1
            const fittingtaskstatus = "COMPLETED"
            const fittingrequeststatus = "COMPLETED"
    
            const fittingTaskUpdateQeury = `
               UPDATE fitting_tasks SET fittingtaskstatus=$1, isdone=$2
               WHERE fittingtaskid = $3
            `
            await pool.query(fittingTaskUpdateQeury,[fittingtaskstatus, idDone, taskId])
    
            const fittingRequestUpdateQuery = `
              UPDATE fitting_requests SET status=$1 WHERE fittingid = $2
            `
            await pool.query(fittingRequestUpdateQuery, [fittingrequeststatus, fittingId])
    
            await pool.query("COMMIT")
            
            sendJSONresponse(res, 200, {"message":`${taskname} task has been completed successfully`})
    
           }catch(err){
             await pool.query("ROLLBACK")
             sendJSONresponse(res, 400, {"message":`Failed to complete ${taskname} task`, err})
           }

    }
    
    
}


module.exports.readCustomerFittings = (req, res)=>{
      const userId = req.params.userId
      pool.query(`SELECT 
            fitting_requests.*, customers.*, TO_CHAR(fitting_requests.fittingscheduledate, 'YYYY-MM-DD') AS formatted_fittingscheduledate
            FROM fitting_requests 
            LEFT JOIN customers ON customers.userid = fitting_requests.userid
            WHERE customers.userid = $1`,
            [
                userId
            ])
        .then((response)=>{
        sendJSONresponse(res, 200, response.rows)
        }).catch((err)=>{
        sendJSONresponse(res, 401, err)
        })

}


module.exports.viewFittingProgressList = (req, res)=>{
     const userId = req.params.userId
     pool.query(`SELECT customers.firstname, customers.lastname,
            fitting_requests.*, TO_CHAR(fitting_requests.fittingscheduledate, 'YYYY-MM-DD') AS formatted_fittingscheduledate FROM fitting_requests 
            LEFT JOIN customers ON customers.userid = fitting_requests.userid
            LEFT JOIN fitting_tasks ON fitting_tasks.fittingid = fitting_requests.fittingid
            WHERE fitting_requests.status NOT IN ('COMPLETED', 'CANCELLED') AND customers.userid = $1
            GROUP BY fitting_requests.fittingid, customers.firstname, customers.lastname`,
        [
            userId
        ])
    .then((response)=>{
    sendJSONresponse(res, 200, response.rows)
    }).catch((err)=>{
    sendJSONresponse(res, 401, err)
    })
}

module.exports.viewFittingTaskProgressList = (req, res)=>{
    const fittingId = req.params.fittingId
        pool.query(`SELECT * FROM fitting_tasks 
            LEFT JOIN fitting_requests ON fitting_requests.fittingid = fitting_tasks.fittingid
            WHERE fitting_tasks.fittingid = $1`,
        [
            fittingId
        ])
    .then((response)=>{
    sendJSONresponse(res, 200, response.rows)
    }).catch((err)=>{
    sendJSONresponse(res, 401, err)
    })

}

module.exports.getAvailableFittingRequestDateTime = (req, res)=>{
    pool.query(`SELECT fittingid AS id, fittingscheduledate AS date, fittingscheduletime AS time
            FROM public.fitting_requests
            WHERE fittingscheduledate >= CURRENT_DATE
            ORDER BY fittingscheduledate ASC`)
        .then((response)=>{
        sendJSONresponse(res, 200, response.rows)
        }).catch((err)=>{
        sendJSONresponse(res, 401, err)
        })

}