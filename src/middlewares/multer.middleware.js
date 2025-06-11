import multer from "multer"


// Why Use function (req, file, cb)?

// Multer gives you access to:
// The incoming HTTP request
// The file info
// The ability to call a callback to control how the file is handled

const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, "./public/temp")
  },
  filename: function(req, file, cb){
    cb(null, file.originalname)
  }
})

export const upload = multer ({storage: storage})