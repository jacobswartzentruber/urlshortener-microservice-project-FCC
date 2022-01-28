require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();
const { Schema } = require('mongoose');
const mongoose = require('mongoose');
const validUrl = require('valid-url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: "false"}));

//Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

//Database Schema and Models
const linkSchema = new Schema({
  original_url: String,
  short_url: String
});

const Link = mongoose.model("Link", linkSchema);

//Routing
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', function(req, res, next) {
  //Validate form long URL string
  let originalUrl = validUrl.isWebUri(req.body.url);
  if(!originalUrl){
    res.json({error: 'invalid url'});
  }
  else{
    //Calculate short URL based on number of documents
    Link.countDocuments({}, function(err, count){
      if(err) return next(err);

      let link = new Link({original_url: req.body.url, short_url: count});

      //Save to DB and return a JSON object with original_url and short_url
      link.save(function(err, data) {
        if(err) return next(err);
        res.json({original_url: req.body.url, short_url: count});
      })
    })
  }
});

app.get("/api/shorturl/:shorturl", (req, res, next) => {
  //Get original URL from short URL param and redirect
  Link.findOne({short_url: req.params.shorturl}, (err, link) => {
    if(err) return next(err);
    res.redirect(302, link.original_url);
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
