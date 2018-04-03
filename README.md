# Online-Check-in
Online Check-in allows users to check in for check-in objects that are activated by the admin. Basically, the app is divided in two functionalities: admin and users:
 
-Admin: The admin has access to activating/deactivating check-in strings. In addition, admin will have access to all the attendees for all past activated check-ins. 
"Show History" provides a list of all attendees with separate sections for a particular check-in string. Each section has date and time at which the checkin was initiated.
"Stop Check-in" stops the checkin and views attendees who have checked in for the current activated string. 

-Users: Once the admin has activated a check-in string, users can perform check-in by mentioning the associated check-in string.

Features: 

1) The app is made robust by error checking. If user tries to check-in to a deactivated id, an error is generated. Similarly, there
are error messages generated for requests to non-existent check-in strings by Admin. 

2) Protected access to Admin content. No GET request can be made to access the admin page. Correct credentials have to be provided.

3) If admin tries to reactivate an already activated ID, an error is generated. 

4) Unique Attendees in Checkin: If the admin clicks on 'View History', the server dispays the count of all the unique attendees for that check-in-string. 

