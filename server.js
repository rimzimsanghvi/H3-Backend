//----------Imports----------

//Using multer to handle file uploads :
const multer = require("multer")

//For routing, express : 
const express = require("express")
const app = express()
const cors = require("cors"); //Also handling cors
var bodyParser = require('body-parser')

//For handling xlsx files : 
const xlsx = require('xlsx')

//For API requests : 
const axios = require('axios');

//----------End of Imports----------


//----------Handler functions----------

//By default multer does not store to disk,
//For ease of data manipulation we are writing to disk:
const storage = multer.diskStorage({
    destination: "./uploads/",
})
const upload = multer({ storage : storage }).single("file")

//Async cus we have to await for all axios requests before writing to xlsx file
async function handle_file(req,res){
    var file = xlsx.readFile(req.file.path)
    let response_list = []; //To store a list of list's of response values
    for (let i=2;i<file.Strings.length;i++){ //Avoiding 2 index as they are the 2 values in first row
        console.log(file.Strings[i].h)
        if(file.Strings[i].h !== '' && file.Strings[i].h!=undefined){
            await axios.get("https://api.storerestapi.com/products/"+file.Strings[i].h)
                .then((response)=>{
                    response_list.push([response.data.data.price])
                    console.log(response_list)
                })
                .catch((err)=>{
                    response_list.push(["null"])
                    console.log(err);
                })
        }
    }
    xlsx.utils.sheet_add_aoa(file.Sheets[file.SheetNames[0]],response_list, { origin: "B2" }); //writing to respective sheet into respective places
    xlsx.writeFile(file, req.file.originalname);//Writing a new xlsx file with same name a uploaded file *requirement*
}
//----------End of Handler functions----------


//----------Route----------
app.post('/upload', upload ,async function (req, res) { //Posts upload route, callback of upload "instance of multer"
    await handle_file(req,res) //await for file write before download
    res.download(req.file.originalname,function(err){ //express inbuilt donwlod
        if(err){
            console.log(err);
        }
    })
    console.log(req.file, req.body)
});

//TEST :
app.get('/', (req, res) => { //TEST SITE ONLY
  res.sendFile(__dirname+'/test.html');
});

//----------End of Routes----------


//Starting server : 
var corsOptions = {
    origin: "*" //Any origin
};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.listen(8080, () => {
    console.log(`Running at localhost:8080`);
});
