const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.connect('mongodb+srv://lancelee92:29EWJkVvv6LsUa9t@cluster0.kzzhc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority')

const userSchema = new Schema({
  username:  String, // String is shorthand for {type: String}  
});
const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
});
const logSchema = new Schema({
  username: String,
  count: Number,
  log: [{ description: String, duration: Number, date: String }]
});
const users = mongoose.model('users', userSchema);
const exercises = mongoose.model('exercises', exerciseSchema);
const logs = mongoose.model('logs', userSchema);

require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/test', (req, res) => {
  res.json(req.query);
});

app.get('/removeAll', (req, res) => {
  exercises.deleteMany().exec();
});

app.get('/api/users/:_id/logs', (req, res) => {
  users.findById(req.params._id, (err, user) => {
    if(err) {
      return res.json({'errorHere': err});
    }
    else {
      //['description', 'duration', 'date']

      let query = exercises.find({ username: user.username });

      if(req.query.from){
        query = query.find({ date: { $gte: req.query.from } });
      }
      if(req.query.to){
        query = query.find({ date: { $lte: req.query.to } });
      }
      if(req.query.limit){
        query = query.limit(req.query.limit);
      }
      query = query.select(['-_id', '-username', '-__v']);
      query.exec((err, docs) => {
        if(err)
          return res.json({ 'error': err });

        docs.map(x => x.date = new Date(x.date).toDateString());
        return res.json({
          '_id': user._id,
          'username': user.username,
          'count': docs.length,
          'log': docs
        })
      });
    }

  });
});

app.get('/api/users', (req, res) => {
  users.find().select(['_id', 'username']).exec((err, doc) => {
    if(err)
      return res.json(err);

    res.json(doc);
  });
});

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

app.post('/api/users/:_id/exercises', (req, res) => {
  //{":_id":"1","description":"adf","duration":"fdasfasfa","date":"asdfasfsfasdfsdf","_id":"1"}
  //res.json({...req.body, ...req.params});
  users.findById(req.params._id, (err, user) => {
    if(err) {
      return res.json({'errorHere': err});
    }
    else {
      let strDate = formatDate(new Date());

      if(req.body.date){
        strDate = req.body.date;
      }
      
      const exercise = new exercises();
      exercise.username = user.username;
      exercise.description = req.body.description,
      exercise.duration = req.body.duration,
      exercise.date = strDate

      exercise.save((err, doc) => {
        if(err)
          return res.json(err);
    
          return  res.json({"_id": user._id,
                        "username":doc.username,
                        "date":new Date(doc.date).toDateString(),
                        "duration":doc.duration,
                        "description": doc.description
                       });
      });
    }

  });
});

app.post('/api/users', (req, res) => {
  //{"username":"lancelee92"}
  const user = new users();
  user.username = req.body.username;

  user.save((err, doc) => {
    if(err)
      return res.json(err);

    res.json({ '_id': doc._id, 'username': doc.username });
  })
  
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
