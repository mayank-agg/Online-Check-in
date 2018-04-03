var express= require('express');
var qs= require('querystring');
var fs= require('fs');
var path= require('path');
var http= require('http');
//var flash= require('express-flash');
var flash= require('req-flash');
var port= 33108;
var app= express();
app.use(express.static("."));
var mongoClient= require('mongodb').MongoClient;

fs.stat('./adminLanding.html', function (err, stats) {      //Deleting the adminPage if already exists. This would prevent returning admin page on restarting the server.
   if (err) {
       return console.error(err);
   }

   fs.unlink('./adminLanding.html',function(err){
        if(err) return console.log(err);
   });
});
var database;
var collection;
var url= "mongodb://Mayank:987MAYnk@ds117469.mlab.com:17469/assignment3_database"     //Connecting to database through mLab.
//var url = 'mongodb://maggarwa:987MAYnk@127.0.0.1:27017/cmpt218_maggarwa?authSource=admin'     //Connecting to our cmpt218 db.
mongoClient.connect(url, function(err, client)
{
  if (err)
  {
    console.log(err);
  }
  else {
    database= client.db("assignment3_database");      //use assignment3_database
    //database= client.db("cmpt218_maggarwa");      //Use my database.
    collection= database.collection("attendeesCollection");     //Creating a collection of attendees. This will store each attendee as a document with a unique _id. Each attendee will have a fname, checkin string and userid.
    console.log("connected");
  }
});

var optionLogin = {
  extensions: ['htm', 'html'],
  index: "login.html"
}
var optionThankYou = {
  extensions: ['htm', 'html'],
  index: "thankYou.html"
}
var optionAdmin = {
  extensions: ['htm', 'html'],
  index: "adminLanding.html"
}


var adminCheckID;
var attendees= [];   //An array that will store attendees.

var filepath= path.join(__dirname, "adminLanding.html");      //HTML for admin page (Dynamically)
var jsonpath= path.join(__dirname, "allAttendees.json");      //Creating JSON file that will have all users checking-in.

var tempCont= fs.readFileSync("./adminLandingtempor.html");
var thankyou= fs.readFileSync("./staticFiles/thankYou.html");

//Body parsing:

app.use(express.json());      //For all types of incoming requests at / (Def= /), execute express.json
app.use(express.urlencoded({extended: false}));

//Serving css/login for each request.
app.use('/', express.static('./staticFiles', optionLogin));     //On all type of requests on root, serve login.html

var historyAttendees= [];
var toPush;
app.post('/attendees', function(req, res, next)
{
  var checkString= req.body.adminCheck;
  collection.find({"checkInString":`${req.body.adminCheck}`}).toArray().then(function(array) {
  if(array.length == 0)
  {
    var retSame= fs.readFileSync("./adminLanding.html");
    retSame= servePage('./adminLanding.html', "<p id='noCheckIn'>[.]*</p>", "<p style='color: red; font-size: 12px'>"+`${req.body.adminCheck}`+" has either never been activated or no Users have checked in.\n No History available. </p>");
    res.write(retSame);
    res.end();
  }
  else
  {
    array.forEach(function(mydoc)
    {
        toPush= {
        "FirstName":mydoc.fname,
        "StudentID":mydoc.userid,
        "SectionNumber":mydoc.sectionNumber,
        "DateSection":mydoc.dateOfSection
        }
     historyAttendees.push(toPush);
   });
   res.write('<!DOCTYPE html> <html><head><title> All Attendees </title>  <link rel="stylesheet" href= "./asn3style.css"> </head> <body><h1> Following are all previous attendees for '+`${req.body.adminCheck}`+'</h1>'+formattedData(historyAttendees));
   historyAttendees= new Array();
   res.end();
  }
});
});
//Handling login post request
app.post('/', function(req, res, next)
{
  if(checkQuery(req.body))
  {
    fs.writeFileSync(filepath,tempCont);
    var myFile= fs.readFileSync('./adminLanding.html');
    res.write(myFile);
  }
  else
  {
    var errorPage= fs.readFileSync("./staticFiles/login.html");
    errorPage= servePage('./staticFiles/login.html', "<p id='errorLine'>[.]*</p>", "<p style= 'color: red; font-size: 12px' id='errorLine'>Wrong Credentials. Please try again.</p>");
    res.write(errorPage);
  }
  res.end();
});


function servePage(path, regex, value)
{
  var myFile= fs.readFileSync(path);
  var regexBuild= new RegExp(regex);
  return myFile.toString().replace(regexBuild, value);
}

//handling admin post request
var date;
var activatedIds= [];
app.post('/adminLanding.html', function(req, res, next)
{
  date= Date();
  var adminCheck= req.body.checkinID;
  var find= findID(activatedIds, adminCheck);
  if(find==true)
  {
      var sameFile= fs.readFileSync('./adminLanding.html');
      sameFile= servePage('./adminLanding.html', "<p id='sameCheckIn'>[.]*</p>", "<p id= 'sameCheckIn' style= 'color: red; font-size: 12px'>"+`${req.body.checkinID}`+" is already active. Please try again. </p>");
      res.write(sameFile);
  }
  else
  {
    collection.insert({"courseName":`${req.body.checkinID}`, "checkinTime":date});     //Adding courseName to database to keep track of same check ins.
    activatedIds.push(adminCheck);
    var stopCheck= fs.readFileSync("./staticFiles/stopCheckIn.html");
    stopCheck= servePage('./staticFiles/stopCheckIn.html', '<h3 id="courseID">[.]*</h3>', '<h3 id="courseID">'+`${req.body.checkinID}`+'</h3>');
    res.write(stopCheck);
  }
  res.end();
});

function findID(array, id)
{
  for(var t=0; t<array.length; t++)
  {
    if(array[t]==id)
    {
      return true;
    }
    else {
      continue;
    }
  }
  return false;
}

//Handling users post request (when user goes to checkin page and checks in)
var currentAttendees= [];
var arrSections= [];
app.post('/checkin.html', function(req, res, next)
{
  if(checkActivated(`${req.body.checkInString}`))
  {
    var count =0;
    var myCourseID= `${req.body.checkInString}`;
    collection.find({"courseName":myCourseID}).toArray().then(function(array)
    {
       array.forEach(function(mydoc)
        {
          count++;
          if(arrSections.indexOf(mydoc.checkinTime) == -1)      //Push date only if date does not exist. This is done to avoid adding same dates each time the user of same section checks in.
          {
            arrSections.push(mydoc.checkinTime);     //arrSections has date for each section now.
          }
        });
          var numberOfSections= count;
          collection.insert({"userid":`${req.body.userid}`, "fname":`${req.body.fname}`, "checkInString":`${req.body.checkInString}`, "sectionNumber":numberOfSections, "dateOfSection":arrSections[numberOfSections-1] }, function(err, result)
          {
            if (err)
            {
              console.log(err);
            }
          });     //Inserting one document each when a user checks in.
          var user= {
            "FirstName": `${req.body.fname}`,
            "StudentID": `${req.body.userid}`,
            "SectionNumber": numberOfSections,
            "DateSection": arrSections[numberOfSections-1]
          }
          currentAttendees.push(user);        //Maintaining current users.
          res.write(thankyou);
          res.end();
        });
  }
  else
  {
    var fileReturn= fs.readFileSync("./staticFiles/checkin.html");
    fileReturn= servePage('./staticFiles/checkin.html', "<p id='notActive'>[.]*</p>","<p id='notActive' style= 'color: red; font-size: 14px'>"+`${req.body.checkInString}`+" has not been activated by Admin. Please try again later! </p>");
    res.write(fileReturn);
    res.end()
  }
});


app.post('/viewAttendees', function(req, res, next)       //entertaining stop request.
{
  for(var g=0; g<activatedIds.length; g++)    //removing from activated id.
  {
    if(activatedIds[g] == req.body.courseID)
    {
      var index=g;
      activatedIds.splice(index);
    }
    else {
      continue;
    }
  }
  res.write('<!DOCTYPE html> <html><head><title> Current Attendees </title>  <link rel="stylesheet" href= "./asn3style.css"> </head> <body><h1> Following are current attendees for '+`${req.body.courseID}`+'</h1>'+formattedData2(currentAttendees));
  currentAttendees= new Array();
  res.end();
  //write response to show current attendees in req.body.courseID
});

app.get('/checkin.html', function(req, res, next)
{
  var checkIn= fs.readFileSync("./staticFiles/checkin.html");
  checkIn= servePage('./staticFiles/checkin.html', '<p style="border: 1px solid black">[.]*</p>', '<p style="border: 1px solid black"> Currently Activated Check Ins: '+printActivated(activatedIds)+'</p>');
  res.write(checkIn);
  res.end();
});

function printActivated(actArray)
{
  if(actArray.length > 0)
  {
    var stringRet= "[ ";
    for(var q=0; q<actArray.length-1; q++)
    {
      stringRet+= actArray[q];
      stringRet+= ", ";
    }
    stringRet+= actArray[actArray.length-1];
    stringRet+= " ]";
    return stringRet;
  }
  else
  {
    var stringRet= "No currently activated IDs. Try again Later!"
    return stringRet;
  }
}

function formattedData2(userArray)
{
  var stringVar= "<table>  <tr style='background-color: black; color: white'> <th> Check-in Section Number </th> <th> Date and Time [ADMIN Check-in] </th> <th>First Name</th>  <th> USER ID </th> </tr>";
  if(userArray.length !=0)
  {
    var sectionCompare= userArray[0].SectionNumber;
    stringVar+= "<tr>";
    stringVar+="<td>"+userArray[0].SectionNumber+"</td>";
    stringVar+="<td>"+userArray[0].DateSection+"</td>";
    stringVar += "<td>"+userArray[0].FirstName+"</td>";
    stringVar += "<td>"+userArray[0]["StudentID"]+"</td>";
  }
  for(var t=1; t<userArray.length; t++)
  {
    if(userArray[t].SectionNumber == sectionCompare)      //Same as previous section
    {
      stringVar+="<tr>"
      stringVar += "<td> </td>";
      stringVar += "<td> </td>";
      stringVar += "<td>"+userArray[t].FirstName+"</td>";
      stringVar += "<td>"+userArray[t]["StudentID"]+"</td>";
      stringVar+= "</tr>";
    }
    else
    {
      sectionCompare= userArray[t].SectionNumber;
      stringVar+="<tr>"
      stringVar += "<td>"+userArray[t].SectionNumber+"</td>";
      stringVar+= "<td>"+userArray[t].DateSection.toString()+"</td>";
      stringVar += "<td>"+userArray[t].FirstName+"</td>";
      stringVar += "<td>"+userArray[t]["StudentID"]+"</td>";
      stringVar+= "</tr>";
    }

  }
  stringVar+="</table>";

  stringVar+= "<br><b style= 'fontsize: 20'>Total Number of Attendees: ";
  stringVar+= userArray.length;
  stringVar+="</b>";
  return stringVar;
}
function formattedData(userArray)
{

  var stringVar= "<table>  <tr style='background-color: black; color: white'> <th> Check-in Section Number </th> <th> Date and Time [ADMIN Check-in]</th> <th>First Name</th>  <th> USER ID </th> </tr>";
  if(userArray.length !=0)
  {
    var sectionCompare= userArray[0].SectionNumber;
    stringVar+= "<tr>";
    stringVar+="<td>"+userArray[0].SectionNumber+"</td>";
    stringVar+="<td>"+userArray[0].DateSection+"</td>";
    stringVar += "<td>"+userArray[0].FirstName+"</td>";
    stringVar += "<td>"+userArray[0]["StudentID"]+"</td>";
  }
  for(var t=1; t<userArray.length; t++)
  {
    if(userArray[t].SectionNumber == sectionCompare)      //Same as previous section
    {
      stringVar+="<tr>"
      stringVar += "<td> </td>";
      stringVar += "<td> </td>";
      stringVar += "<td>"+userArray[t].FirstName+"</td>";
      stringVar += "<td>"+userArray[t]["StudentID"]+"</td>";
      stringVar+= "</tr>";
    }
    else
    {
      sectionCompare= userArray[t].SectionNumber;
      stringVar+="<tr>"
      stringVar += "<td>"+userArray[t].SectionNumber+"</td>";
      stringVar+= "<td>"+userArray[t].DateSection+"</td>";
      stringVar += "<td>"+userArray[t].FirstName+"</td>";
      stringVar += "<td>"+userArray[t]["StudentID"]+"</td>";
      stringVar+= "</tr>";
    }
  }
  stringVar+="</table>";

  totUnique=0;

  for(var t=0; t<userArray.length; t++)
  {
    if(searchFwd(userArray, userArray[t].FirstName+userArray[t].StudentID, t+1)==false)
    {
      totUnique++;
    }
    else {
      continue;
    }
  }
  stringVar+= "<br><b style= 'fontsize: 20'>Total Number of Unique Attendees irrespective of sections: ";
  stringVar+= totUnique;
  stringVar+="</b>";
  return stringVar;
}
function searchFwd(arr, value, index)
{
  for(var k=index; k<arr.length; k++)
  {
    if(arr[k].FirstName+arr[k].StudentID==value)
    {
      return true;
    }
    else {
      continue;
    }

  }
  return false;
}
function checkActivated(checkInString)
{
  for(var k=0; k< activatedIds.length; k++)
  {
    if(activatedIds[k]==checkInString)
    {
      return true;
    }
    else
    {
      continue;
    }
  }
  return false;
}

function checkQuery(query)
{
  if((query["username"] == "admin") && (query["password"] == 1234))
  {
     return true;
  }
  else {
    return false;
  }
}

http.createServer(app).listen(port);
