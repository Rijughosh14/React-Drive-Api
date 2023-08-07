const express=require('express')
const app=express();
const cors=require('cors');
const multer=require('multer')
const {OAuth2Client} = require('google-auth-library');
const { google } = require('googleapis');

//for uploading file
const upload=multer()

const CLIENT_ID=process.env.CLIENT_ID
  const CLIENT_SECRET= process.env.CLIENT_SECRET

//for drive api
const auth = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET);

//for authentication
const client = new OAuth2Client({
    clientId:process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: 'http://localhost:3001/api/auth',
});

//cors config
app.use(cors({origin:true,credentials:true}))
//express json
app.use(express.json())
//url encode
app.use(express.urlencoded({extended:false}));


//userid
var userid

//  structure to store access tokens
const accessTokenStore = {};
const refreshTokenStore = {};
  

  // Set the required scopes for accessing Google Drive API
const scopes = ['https://www.googleapis.com/auth/drive'];

// Generate the authorization URL
const authUrl = client.generateAuthUrl({
    access_type: 'offline', // To obtain a refresh token
    scope: scopes,
  });


  //authentication url
app.post('/api/login', async(req,res)=> {
    const token=req.body.credential
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
         
        });
        const payload = ticket.getPayload();
         userid = payload['sub'];
         res.redirect(authUrl);
        //  console.log(payload)
      }
     catch (error) {
        const redirectUrl = 'http://localhost:3000/file?auth=false';
        res.redirect(redirectUrl);
        console.log(error)
    }})


    //authorization redirect url
    app.get('/api/auth',async(req,res)=>{
        const code=req.query.code
        try {
            // Exchange authorization code for access token
            const tokenResponse = await client.getToken(code);
            const accessToken = tokenResponse.tokens.access_token;
            const refreshToken = tokenResponse.tokens.refresh_token;

            //storing the acess token
            accessTokenStore[userid] = accessToken;
            //storing the refresh token
            refreshTokenStore[userid]= refreshToken;
        
            // Redirect the user to a success page or perform further actions
            res.redirect(`http://localhost:3000/file?auth=true&userid=${userid}`);
          } catch (error) {
            console.error('Error exchanging code for token:', error);
            res.status(500).send('Error exchanging code for token');
          }
    })



 //listing files
    app.get('/api/file/list/:id',(req,res)=>{

      const id=req.params.id
      const accessToken=accessTokenStore[id]

      //setting the accessToken in drive api
      auth.setCredentials({ access_token:accessToken });

      //creating the drive instance
    const drive = google.drive({ version: 'v3', auth });


    new Promise((resolve,reject)=>{
      drive.files.list({
        pageSize: 10,
        fields: 'files(name, id)',
      }, (err, res) => {
        if (err) {
          console.error('Error listing files:', err);
          reject(err)
        } else {
          const files = res.data.files;
          if (files.length) {
            resolve(files)
          } else {
            console.log('No files found.');
          }
        }
      })
    })
      .then((file)=>{
        res.send(file)
      })
      .catch((error)=>{
        console.log(error)
      })    
    })



 //retrieve file metadata
    app.get('/api/file/meta/:id/:uid',(req,res)=>{

      const id=req.params.id
      const uid=req.params.uid
      const accessToken=accessTokenStore[id]

      //setting the accessToken in drive api
      auth.setCredentials({ access_token:accessToken });

      //creating the drive instance
    const drive = google.drive({ version: 'v3', auth });


    new Promise((resolve,reject)=>{
      drive.files.get({
        fileId: uid,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents',
      }, (err, res) => {
        if (err) {
          console.error('Error listing files:', err);
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
      .then((data)=>{
        res.send(data)
      })
      .catch((error)=>{
        console.log(error)
      })    
    })





//upload files
    app.post('/api/file/upload',upload.single('filedata'),async(req,res)=>{

      const {id}=req.body
      const filedata=req.file
      const accessToken=accessTokenStore[id]

      //setting the accessToken in drive api
      auth.setCredentials({ access_token:accessToken });

      //creating the drive instance
    const drive = google.drive({ version: 'v3', auth });

    //file details
    const fileMetadata = {
      name: filedata.originalname,
    };
    
    const media = {
      mimeType: filedata.mimetype,
      body: filedata.buffer,
    };

    //making api call
    drive.files.create({
      fileMetadata,
      media: media,
    }, (err) => {
      if (err) {
        console.error('Error uploading file to Google Drive:', err);
        res.status(500).json({ error: 'File upload to Google Drive failed' });
      } else {
        res.json({ message: 'File uploaded successfully' });
      }
    })

    });





 //delete file 
    app.get('/api/file/delete/:id/:uid',(req,res)=>{

      const id=req.params.id
      const uid=req.params.uid
      const accessToken=accessTokenStore[id]

      //setting the accessToken in drive api
      auth.setCredentials({ access_token:accessToken });

      //creating the drive instance
    const drive = google.drive({ version: 'v3', auth });

    //deleting api call
    new Promise((resolve,reject)=>{
      drive.files.delete({
        fileId: uid
      }, (err) => {
        if (err) {
          console.error('Error listing files:', err);
          reject(err)
        }
        else{
          res.json({message:'deleted successfully'})
        }
      })
    })
    .catch((err)=>{
      console.log(err)
    })
  
    })
 



app.listen(3001,()=>{
    console.log("listening at port 3001")
})