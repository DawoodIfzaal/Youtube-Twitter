// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next)
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false, 
//       message: error.message
//     })
//   }
// }

//      Feature	          Why it's needed
// Promise.resolve()	Ensures handler returns a promise
// Wrapper function	  Captures the handler and plugs in .catch
// next(err)	        Passes the error to Express error handler


//      Code	                        Result
// Promise.resolve(42)	      A promise that resolves to 42
// Promise.resolve(myFunc())	Wraps the result of myFunc() in a promise
// Promise.resolve(promise)	  Returns the same promise

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
  }
}

export {asyncHandler}