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
        person['fname'] = "Lars Ole";
        person['lname'] = "Klummesen";
        person['gender'] = "male";
        person['priSport'] = "Cyckling";
        person['height'] = "185";
        person['city'] = "Copenhagen";
        person['address'] = "hovedgaden 4";
        person['zipcode'] = "2380";

        var req;
        req = gapi.client.traeningsvagten.person.insert(person);
        req.execute(function (data) {
            alert( data.id + " " + data.message );
        });

    });

    $('#login').click(function(e){
        handleAuthClick(e);
    });

    function handleClientLoad() {
        gapi.client.setApiKey('AIzaSyCy1yKSG2gs4_Ub6D9hhv_WGq4BZxXXD5Y');
        window.setTimeout(checkAuth,1);
    }


});

function handleAuthClick(event) {
    gapi.auth.authorize({client_id: "385810392059-h55aee1iei6b1an43jnuqsaepjnlb7g5.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/userinfo.email", immediate: false}, handleAuthResult);
    return false;
}

function checkAuth() {
    gapi.auth.authorize({client_id: "385810392059-h55aee1iei6b1an43jnuqsaepjnlb7g5.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/userinfo.email", immediate: true}, handleAuthResult);
}

function handleAuthResult(authResult) {
    var authorizeButton = document.getElementById('login');
    if (authResult) {
        authorizeButton.style.visibility = 'hidden';
        //insertComment();
    } else {
        authorizeButton.style.visibility = '';
        //authorizeButton.onclick = handleAuthClick;
    }
}

function showList(data) {
    for (i = 0; i < data.items.length; i++) {
        $('#dataList').append($("<li></li>").html(data.items[i].fname + " " + data.items[i].lname + " "+data.items[i].email + " "+data.items[i].id   ));
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