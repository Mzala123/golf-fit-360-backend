const { response } = require('express');
const pool = require('../model/db');
const sendJSONresponse = require('../services/response');
const jwt = require('jsonwebtoken');

const {getUser, getSortQuery, getSQLFilter, getPageOffset} = require('../services/utils');
const { use } = require('passport');

module.exports.createFittingRequest = async(req, res)=>{

    const user = await getUser(req)
    const userId = user.userid
    if(!req.body.fittingServiceCategory || !req.body.fittingScheduleDate || !req.body.fittingScheduleTime){
        return sendJSONresponse(res, 400, {message:"Fill in all required fields"})
    }


    let{fittingServiceCategory, status, fittingScheduleDate, fittingScheduleTime, comments} = req.body

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

module.exports.getListFittingRequests = async(req, res)=>{

    try{

    let {limit, page, search, sort} = req.query

    let sortQuery
    if(sort){
     sortQuery = getSortQuery(sort)
    }
    search = search ? search : ""

    let searchQuery = getSQLFilter(["firstName", "lastName", "email", "phoneNumber", "address", "gender", "golfClubSize", "fittingservicecategory", "status"])

    const totalItems = parseInt((await pool.query(`SELECT COUNT(*) FROM fitting_requests LEFT JOIN customers ON 
                customers.userid = fitting_requests.userid  WHERE status NOT IN ('COMPLETED', 'CANCELLED') 
                AND  (
                   CASE WHEN $1::TEXT IS NOT NULL THEN ${searchQuery("$2")}
                   ELSE TRUE END
                ) 
               `, [ search ? `%${search}%` : null, `%${search}%`])).rows[0].count)

    //console.log(totalItems)
    //return totalItems;            

    const {limitDefault, offset} = getPageOffset(page, limit, totalItems)    
    limit = limit ? limit : limitDefault   
   
    const fittingRequestList =  (await pool.query(`SELECT fitting_requests.*, customers.*, 
        TO_CHAR(fitting_requests.fittingscheduledate, 'YYYY-MM-DD') AS formatted_fittingscheduledate
        FROM fitting_requests LEFT JOIN customers ON 
        customers.userid = fitting_requests.userid  WHERE status NOT IN ('COMPLETED', 'CANCELLED') 
        AND (
          CASE WHEN $3::TEXT IS NOT NULL THEN ${searchQuery("$4")}
          ELSE TRUE 
          END
        )  ${ sort ? sortQuery : '' } LIMIT $1::int OFFSET $2::int`, [limit, offset, search ? `%${search}%`: null, `%${search}%`])).rows
    const resultObj = {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        perPage: limit,
        searchQuery: search || "",
        data: fittingRequestList
    }

    sendJSONresponse(res, 200, resultObj)

    }catch(err){
        sendJSONresponse(res, 500, { error: "Internal Server Error", details: err.message });
    }
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

module.exports.fittingRequestSchedules =  async(req, res)=>{

    try{

        let {limit, page, search, sort} = req.query
    
    
        if(sort){
         var sortQuery = getSortQuery(sort)
        }

        let  searchQuery = getSQLFilter(["firstname", "lastname", "fittingservicecategory", "status"])

        const totalItems = parseInt((await pool.query(`SELECT COUNT(*) FROM fitting_requests 
        LEFT JOIN customers ON customers.userid = fitting_requests.userid
        WHERE fitting_requests.status IN ('COMPLETED', 'SCHEDULED') AND
        (
            CASE WHEN $1::TEXT IS NOT NULL THEN ${searchQuery("$2")}
            ELSE TRUE
            END
        )
         `, [search ? `%${search}%`: null, `%${search}%`])).rows[0].count)

        console.log("count is ",totalItems)

        const {limitDefault, offset} = getPageOffset(page, limit, totalItems)    
        limit = limit ? limit : limitDefault   

        const fittingShedule = (await pool.query(`SELECT customers.firstname, customers.lastname,
        fitting_requests.* FROM fitting_requests 
        LEFT JOIN customers ON customers.userid = fitting_requests.userid
        WHERE fitting_requests.status IN ('COMPLETED', 'SCHEDULED') AND
        (
         CASE WHEN  $3::TEXT IS NOT NULL THEN ${searchQuery("$4")}
         ELSE TRUE
         END
        )
         ${ sort ? sortQuery : '' } LIMIT $1::int OFFSET $2::int`, [limit,offset, search ? `%${search}%`: null, `%${search}%`])).rows


        const resultObj = {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            perPage: limit,
            searchQuery: search || "",
            data: fittingShedule
        }
    
        sendJSONresponse(res, 200, resultObj)

    }catch(err){
        console.log(err)
        sendJSONresponse(res, 500, { error: "Internal Server Error", details: err.message });
    }
}


module.exports.fittingRequestHistory = async(req, res)=>{
    try{

        let {limit, page, search, sort} = req.query
        if(sort){
         var sortQuery = getSortQuery(sort)
        }

        let  searchQuery = getSQLFilter(["firstname", "lastname", "fittingservicecategory", "status"])

        const totalItems = parseInt((await pool.query(
            `SELECT COUNT(*) FROM fitting_requests 
             LEFT JOIN customers ON customers.userid = fitting_requests.userid
             WHERE  (
                CASE WHEN $1::TEXT IS NOT NULL THEN ${searchQuery("$2")}
                ELSE TRUE
                END
            )
             `,[search ? `%${search}%`: null, `%${search}%`] )).rows[0].count)

        console.log("count is",totalItems)
        const {limitDefault, offset} = getPageOffset(page, limit, totalItems)    
        limit = limit ? limit : limitDefault   

         const fittingHistory =  (await pool.query(`
            SELECT fitting_requests.*, customers.*, TO_CHAR(fitting_requests.fittingscheduledate, 'YYYY-MM-DD') AS formatted_fittingscheduledate
            FROM fitting_requests LEFT JOIN customers ON customers.userid = fitting_requests.userid
              WHERE  (
                CASE WHEN $3::TEXT IS NOT NULL THEN ${searchQuery("$4")}
                ELSE TRUE
                END
            )  
                ${ sort ? sortQuery : '' } LIMIT $1::int OFFSET $2::int`,[limit, offset,search ? `%${search}%`: null, `%${search}%`])).rows

            const resultObj = {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                perPage: limit,
                searchQuery: search || "",
                data: fittingHistory
            }
        
            sendJSONresponse(res, 200, resultObj)

    }catch(err){
        console.log(err)
        sendJSONresponse(res, 500, { error: "Internal Server Error", details: err.message });
    }
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


module.exports.readCustomerFittings = async(req, res)=>{
    const user = await getUser(req)
    const userId = user.userid
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


module.exports.viewFittingProgressList = async(req, res)=>{
    const user = await getUser(req)
    const userId = user.userid
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
            WHERE fitting_tasks.fittingid = $1 ORDER BY index`,
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

module.exports.cancelFittingRequestsTasks =  (req, res)=>{
    const fittingId = req.params.fittingId
    pool.query(`UPDATE public.fitting_requests
	      SET status = 'CANCELLED'
	      WHERE fitting_requests.fittingid=$1`,
    [
        fittingId
    ])
    .then(()=>{
        sendJSONresponse(res, 200, {"message":"Fitting request has been cancelled successfully"})
    }).catch((error)=>{
        sendJSONresponse(res, 400, {"message":"Failed to cancel fitting request",error})
    })
}