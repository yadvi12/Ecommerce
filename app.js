const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

const app = express();


//middleware
app.use(bodyParser.json())
app.use(methodOverride('_method'))
app.set('view engine', 'ejs')

//create mongo connection

const mongoURI = 'mongodb://localhost:27017/myapp';
const conn = mongoose.createConnection(mongoURI)

//init gfs
let gfs;

conn.once('open', function () {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads')
})

//create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

//routes
// get, desc:- uploads file tp db
app.get('/', (req, res) => {
    res.render('index')
})

//@route- post, it uploads to  
app.post('/upload', upload.single('file'), (req, res) => {
    res.json({ file: req.file })
})


//@route -get, it display all the data 
app.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
      // Check if files
      if (!files || files.length === 0) {
        return res.status(404).json({
          err: 'No files exist'
        });
      }
  
      // Files exist
      return res.json(files);
    });
  });

const port = 3000
app.listen(port, '127.0.0.1', () => { console.log(`server started at port: ${port}`) })