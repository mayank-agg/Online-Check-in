$(document).ready(function()
{
  $("#submit").click(function()
  {
    console.log($(this).siblings().text());
    $.ajax({
      url: "/",
      method: GET,
      success: printPage
      })
  });
});

function features()
{
  window.alert("Following are the features of this application: \n\n1) An error page for unauthenticated user. When correct admin credenitals are not met, a flash message is returned.  \n\n2) No access to ADMIN page. If the user has not provided correct credentials, a GET request would not respond with the admin page.\n NOTE: To test this feature, server should be re-run. That is, if correct details are provided on running server, then users can access ADMIN page. However, if admin details are not provided, admin page cannot be accessed.   \n\n3) If admin tries to activate an already activated ID, an error message is generated. That is, an already activated ID cannot be reactivated. \n\n 4) Unique Attendees in Checkin: If the admin clicks on 'View History', the server dispays the count of all the unique attendees for that check-in-string. \n\n5) Different Check in sessions are created and each session has a Section Number and Date on which it was created by ADMIN. ")
}
