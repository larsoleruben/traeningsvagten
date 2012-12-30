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



});

function showList( data ){
    for( i= 0; i< data.items.length; i++){
        $('#dataList').append($("<li></li>").html( data.items[i].fname + " " + data.items[i].lname ));
    }
}

function loadGapi() {
    // Set the API key
    gapi.client.setApiKey('AIzaSyCy1yKSG2gs4_Ub6D9hhv_WGq4BZxXXD5Y');
    // Set: name of service, version and callback function
    gapi.client.load('personendpoint', 'v1', getPersons);
}

function getPersons(){
    var req = gapi.client.personendpoint.listPerson();
    req.execute(function(data) {
        showList(data);
    });
}