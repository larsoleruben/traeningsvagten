/**
 * Created with JetBrains WebStorm.
 * User: lars
 * Date: 12/19/12
 * Time: 12:49 AM
 * To change this template use File | Settings | File Templates.
 */

$(document).ready(function () {
    /*
     var apiUrl = "https://datavagten.appspot.com/_ah/api/personendpoint/v1/person";
     $.ajax({
     url: apiUrl,
     dataType: 'json',
     contentType: 'application/json',
     type: "GET",
     success: function(data) {
     showList(data);
     },
     error: function(xhr, ajaxOptions, thrownError) {
     console.error("Beer list error: " + xhr.status);
     }
     });


     */
    $('#inputButton').click(function () {
        var person = {};
        person['fname'] = "Peter Plys";
        person['lname'] = "Plyssensens";
        person['gender'] = "male";
        person['prisport'] = "cyckling";
        person['height'] = "182";
        person['city'] = "Copenhagen";
        person['address'] = "hovedgaden 4";
        person['zipcode'] = "2280";

        var req;
        req = gapi.client.traeningsvagten.insertPerson(person);
        req.execute(function (data) {
            alert( data.id );
        });

    });


});

function showList(data) {
    for (i = 0; i < data.items.length; i++) {
        $('#dataList').append($("<li></li>").html(data.items[i].fname + " " + data.items[i].lname));
    }
}

function loadGapi() {
    // Set the API key
    gapi.client.setApiKey('AIzaSyCy1yKSG2gs4_Ub6D9hhv_WGq4BZxXXD5Y');
    // Set: name of service, version and callback function
    gapi.client.load('traeningsvagten', 'v1', getPersons);
}

function getPersons() {
    var req = gapi.client.traeningsvagten.listPerson();
    req.execute(function (data) {
        showList(data);
    });
}