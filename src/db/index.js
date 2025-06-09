import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"


const connectDB = async () => {
  console.log(process.env.MONGODB_URL)
  try{
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
    console.log("MongoDB connection sucessfull")
  }
  catch(error){
    console.log("MongoDB Connection Error", error)
    process.exit(1)
  }
}

export default connectDB