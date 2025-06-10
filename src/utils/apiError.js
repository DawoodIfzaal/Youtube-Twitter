class ApiError extends Error{
  constructor(
    statusCode,
    message = "something went wrong",
    errors = [],
    stack = ""
  ){
    super(message)
    this.statusCode = statusCode
    this.data = null
    this.message = message
    this.success = false
    this.errors = errors

//      Feature	                    Purpose
// Error.captureStackTrace	 Cleanly generates stack traces on custom error objects
// this	                     Where the stack is attached
// this.constructor	         Skips constructor from the trace

    if(stack){
      this.stack = stack
    }else{
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export {ApiError}