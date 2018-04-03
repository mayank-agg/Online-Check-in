var myButton= document.getElementById("button");
myButton.addEventListener('click', sendRequest);

function sendRequest()
{
  console.log("Sending a post request");
  $.ajax({
    url: "/checkin",
    method: "POST",
    data:  'check-in-string='+$('#check-in-string').val()+'&amp;fname='+$('#fname').val()+'&amp;userid='+$('#userid').val(),
    success: showData
  });
}

myButton.addEventListener('click', sendGetRequest);
function sendGetRequest()
{
  console.log("Sending a get request");
  $.ajax({
    url: "/thankYou",
    method: "GET",
    data: ' ',
    success: showFile
  });
}

function showData(data)
{
   console.log(data);
}
function showFile(data)
{
  console.log(data);
}
