var express= require('express');
var qs= require('querystring');
var fs= require('fs');
var path= require('path');
var http= require('http');
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
  console.log(req.body);
  var checkString= req.body.adminCheck;
  console.log(checkString);
  /*collection.find({"checkInString":`${req.body.adminCheck}`}).forEach(function(mydoc)
   {
    console.log(mydoc.fname);
    console.log(mydoc.userid);
    toPush= {
      "FirstName": mydoc.fname,
      "StudentID": mydoc.userid,
      "SectionNumber":mydoc.sectionNumber
    }
    historyAttendees.push(toPush);     //pushes all attendees of mentioned field.
  //  console.log(historyAttendees);
  });
//  historyAttendees= createHistoryArray(checkString);
  console.log("hello");
  console.log(historyAttendees);
  res.write('<!DOCTYPE html> <html><head><title> All Attendees </title>  <link rel="stylesheet" href= "./asn3style.css"> </head> <body><h1> Following are all previous attendees for '+`${req.body.adminCheck}`+'</h1>'+formattedData2(historyAttendees));
//  historyAttendees= new Array();
  historyAttendees= new Array();*/
collection.find({"checkInString":`${req.body.adminCheck}`}).toArray().then(function(array) {

  if(array.length == 0)
  {
    res.write("This check-in has either not been created or no user has checked in yet. ");
    res.end();
  }
  else
  {
    for(var l=0; l<array.length; l++)
    {
        toPush= {
        "FirstName":array[l].fname,
        "StudentID":array[l].userid,
        "SectionNumber":array[l].sectionNumber,
        "DateSection":array[l].dateOfSection
        }
      }
     console.log(historyAttendees);
     historyAttendees.push(toPush);
   }
   console.log(historyAttendees);
   res.write('<!DOCTYPE html> <html><head><title> All Attendees </title>  <link rel="stylesheet" href= "./asn3style.css"> </head> <body><h1> Following are all previous attendees for '+`${req.body.adminCheck}`+'</h1>'+formattedData(historyAttendees));
   historyAttendees= new Array();
   res.end();
 });
});

/*function createHistoryArray(courseID)
{
  var arr= [];
  console.log(courseID);
  collection.find({"checkInStirng":courseID}).forEach(function(mydoc)
  {
    toPush= {
      "FirstName": mydoc.fname,
      "StudentID": mydoc.userid,
      "SectionNumber":mydoc.sectionNumber
    }
    arr.push(toPush);
  });
  return arr;
}*/
//Handling login post request
app.post('/', function(req, res, next)
{
  console.log(req.body);
  if(checkQuery(req.body))
  {
    fs.writeFileSync(filepath,tempCont);
    var myFile= fs.readFileSync('./adminLanding.html');
    res.write(myFile);
  }
  else
  {
    //show error
    res.write("Either username or Password is incorrect. Please try again. ");
  }
  res.end();
});


function servePage(path, regex, value)
{
  var myFile= fs.readFileSync(path);
  var regexBuild= new RegExp(regex);
  console.log(value);
  console.log(myFile.toString());
  return myFile.toString().replace(regexBuild, value);
}

//handling admin post request
var date;
var activatedIds= [];
app.post('/adminLanding.html', function(req, res, next)
{
  date= Date();
  var adminCheck= req.body.checkinID;

  console.log(activatedIds);
  var find= findID(activatedIds, adminCheck);
  console.log(find);
  if(find==true)
  {
      res.write(adminCheck+" is already active. Activating an already activated check-in-string is prohibited. ");
  }
  else
  {
    collection.insert({"courseName":`${req.body.checkinID}`, "checkinTime":date});     //Adding courseName to database to keep track of same check ins.
    console.log(`${req.body.checkinID}`+": pushed at "+date);
    activatedIds.push(adminCheck);
    console.log(adminCheck);
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
        console.log(arrSections);
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
    //    console.log(user);
        currentAttendees.push(user);        //Maintaining current users.
        res.write(thankyou);
        res.end();
    });
  }
  else
  {
    res.write(`${req.body.checkInString}`+" has not been activated by Admin. Please try again later! ");
    res.end()
  }
});


app.post('/viewAttendees', function(req, res, next)       //entertaining stop request.
{
  //console.log(req.body.courseID);
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
  var stringVar= "<table>  <tr> <th> Check-in Section Number </th> <th>First Name</th>  <th> Student ID </th> </tr>";
  var sectionCompare= userArray[0].SectionNumber;
  stringVar+= "<tr>";
  stringVar+="<td>"+userArray[0].SectionNumber+": "+userArray[0].DateSection+"</td>";
  stringVar += "<td>"+userArray[0].FirstName+"</td>";
  stringVar += "<td>"+userArray[0]["StudentID"]+"</td>";
  for(var t=1; t<userArray.length; t++)
  {
    if(userArray[t].SectionNumber == sectionCompare)      //Same as previous section
    {
      stringVar+="<tr>"
      stringVar += "<td> </td>";
      stringVar += "<td>"+userArray[t].FirstName+"</td>";
      stringVar += "<td>"+userArray[t]["StudentID"]+"</td>";
      stringVar+= "</tr>";
    }
    else
    {
      sectionCompare= userArray[t].SectionNumber;
      stringVar+="<tr>"
      stringVar += "<td>"+userArray[t].SectionNumber+": "+userArray[t].DateSection.toString()+"</td>";
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
  var stringVar= "<table>  <tr> <th> Check-in Section Number </th> <th>First Name</th>  <th> Student ID </th> </tr>";
  var sectionCompare= userArray[0].SectionNumber;
  stringVar+= "<tr>";
  stringVar+="<td>"+userArray[0].SectionNumber+": "+userArray[0].DateSection+"</td>";
  stringVar += "<td>"+userArray[0].FirstName+"</td>";
  stringVar += "<td>"+userArray[0]["StudentID"]+"</td>";
  for(var t=1; t<userArray.length; t++)
  {
    if(userArray[t].SectionNumber == sectionCompare)      //Same as previous section
    {
      stringVar+="<tr>"
      stringVar += "<td> </td>";
      stringVar += "<td>"+userArray[t].FirstName+"</td>";
      stringVar += "<td>"+userArray[t]["StudentID"]+"</td>";
      stringVar+= "</tr>";
    }
    else
    {
      sectionCompare= userArray[t].SectionNumber;
      stringVar+="<tr>"
      stringVar += "<td>"+userArray[t].SectionNumber+": "+userArray[t].DateSection.toString()+"</td>";
      stringVar += "<td>"+userArray[t].FirstName+"</td>";
      stringVar += "<td>"+userArray[t]["StudentID"]+"</td>";
      stringVar+= "</tr>";
    }
  }
  stringVar+="</table>";
  var toComp= userArray[0].FirstName+userArray[0].StudentID;
  var totUnique=1;
  for(var q=1; q<userArray.length; q++)
  {
    if(userArray[q].FirstName+userArray[q].StudentID!=toComp)
    {
      totUnique++;
    }
    else {
      continue;
    }
  }
  stringVar+= "<br><b style= 'fontsize: 20'>Total Number of  Attendees irrespective of sections: ";
  stringVar+= totUnique;
  stringVar+="</b>";
  return stringVar;
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
