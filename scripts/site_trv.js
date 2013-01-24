/**
 * Created with JetBrains WebStorm.
 * User: lars
 * Date: 12/14/12
 * Time: 7:19 PM
 * To change this template use File | Settings | File Templates.
 */

/*some global vars of different kinds*/
var totEnergy = 0;
var totFat = 0;
var totCarbo = 0;
var totProtein = 0;
var totAlcohol = 0;
var totFiber = 0;
var totCholesterol = 0;
var totSatFat = 0;
var totMonoUnsatFat = 0;
var totSodium = 0;
var totPotassium = 0;
var totMagnesium = 0;
var totIron = 0;
var totWater = 0;
var totAmount = 0;
var focusedInput = null;
/*Currently selected object when choosing the element of the day*/
var curSelFoodObj = null;
var consumed = [];  //array to hold daily consumption of food

/*Google authentication stuff*/
var clientId = "175552442718.apps.googleusercontent.com";
var apiKey = 'AIzaSyCR1g1KlqQBGLbu7c4BmknWCD3X7_Tu0Jk';
var scopes = ["https://www.googleapis.com/auth/userinfo.email","https://www.googleapis.com/auth/userinfo.profile" ];
var userId = null; //is set on the first log in and by authentication

//todays date
var dag;

/*Start the load function to set everything up*/
$(document).ready(function () {

    var test =  { "client": {}, "googleapis.config": { root: "https://datavagten.appspot.com/_ah/api"  }  }

    /* Start load function Declarations */

    dag = new Date();


    /*End load function Declarations*/

    /*initialize visibility setting*/
    $('#personalDetails').hide();
    $('#measurements').hide();
    $('#weigtGraph').hide();
    $('#food').addClass("selected");


    $(document).tooltip();

    $('#search').focus();

    /*Setting up the menu and the default pages*/
    $('#dashboard').click(function () {
        $('#searchFood').hide();
        $('#consumedToday').hide();
        $('#tableDigesting').hide();
        $('#personalDetails').show();
        $('#measurements').show();
        $('#weigtGraph').show();
        $('#dashboard').addClass("selected");
        $('#food').removeClass("selected");


    });

    $('#food').click(function () {
        $('#searchFood').show();
        $('#consumedToday').show();
        $('#tableDigesting').show();
        $('#personalDetails').hide();
        $('#measurements').hide();
        $('#weigtGraph').hide();
        $('#dashboard').removeClass("selected");
        $('#food').addClass("selected");
    });


    /*setting up the dialog popup form*/
    $("#dialog-form").dialog({
        autoOpen:false,
        hide:"explode",
        height:300,
        width:250,
        modal:true,
        buttons:{
            "Tilføj:":function () {
                if (checkInput($('#amount').val(), "num")) {
                    //new way with ipad compatible list boxes
                    addToDay(parseFloat($('#amount').val()));
                    $('#search').focus().val("");
                    $(this).dialog("close");
                }
            },
            Cancel:function () {
                $('.validateTips').html("");
                $('#search').focus().val("");
                $(this).dialog("close");
            }
        }
    });

    $("#addSelected").button()
        .click(function () {
            if(focusedInput != null){
               openDialog( $(focusedInput) );
            }
        });
    /*End modal popup form*/

    //setting up the datepicker for food
    $('#datepicker').val( lpad(dag.getDate(),2) + '/' + lpad(dag.getMonth()+1,2) + '/' + dag.getFullYear());
    $("#datepicker").datepicker({ dateFormat: "dd/mm/yy" });
    //Catching the datepicker change events
    $('#datepicker').change(function(){
        var dateString = $('#datepicker').val().split("/");
        getFood(dateString[2] + dateString[1] + dateString[0]);
    });


    //setting up the datepicker1 personal measurements
    $('#datepicker1').val( lpad(dag.getDate(),2) + '/' + lpad(dag.getMonth()+1,2) + '/' + dag.getFullYear());
    $('#datepicker1').datepicker({ dateFormat: "dd/mm/yy" });

    //Catching the datepicker 1 change events
    $('#datepicker1').change(function(){
        var dateString = $('#datepicker1').val().split("/");
        //The same date both to and from
        var dateFrom = dateString[2] + dateString[1] + dateString[0];
        var dateTo = dateString[2] + dateString[1] + dateString[0];
        var req = gapi.client.trvagten.listMeasurements({'userId':userId, 'dateFrom':dateFrom, 'dateTo':dateTo });
        req.execute(function (data) {
           if( data.items.length > 0){
               $('#measId').val(data.items[0].id);
               $('#datepicker1').val(toNormalDate(data.items[0].measDate));
               $('#weight').val(data.items[0].weight);
               $('#stomac').val(data.items[0].stomac);
               $('#fatPtc').val(data.items[0].fatPtc);
           }else //reset everything to zero except the datepicker field
           {
               $('#measId').val("");
               $('#weight').val("");
               $('#stomac').val("");
               $('#fatPtc').val("");
           }
        });
    });

    $('#search').keypress(function (e) {
        if (e.keyCode == $.ui.keyCode.ENTER ){
            e.preventDefault();
            queryFood($('#search').val());
        }
    });
    //Add the food by hitting enter.
    $('#amount').keypress(function (e) {
        if (e.keyCode == $.ui.keyCode.ENTER && checkInput($('#amount').val(), "num")) {
            e.preventDefault();
            var dateString = $('#datepicker').val().split("/");
            addToDay(parseFloat($('#amount').val()));
            $('#dialog-form').dialog("close");
        }
    });

    $('#findBtn').button().click(function () {
        queryFood($('#search').val());
        $('#search').focus();
    });

    $('#saveDayButton').button().click(function(){
        //declaring the objects for the json string
        var consumed = []; //array to hold the consumed objects
        var food = {}; //object for hold the consumed array and other id's
        var dateString = $('#datepicker').val().split("/");
        food.id = dateString[2] + dateString[1] + dateString[0];
        food.userId = userId;
        food.foodDate = dateString[2] + dateString[1] + dateString[0];
        $(".inDayList").each(function (index) {
            var item = {};
            item.foodId = $(this).attr("id");
            item.foodWeight = $(this).attr("amount");
            item.foodName = $(this).val();
            consumed.push( item );
        });
        food.consumed = JSON.stringify(consumed);
        var req = gapi.client.trvagten.insertFood( food );
        req.execute( function( foodData ){
            var test = foodData;
        });
    });

    //saving the personal measurements for one day
    $('#saveMeasBtn').button().click(function(){
        var dateString = $('#datepicker1').val().split("/");
        var measurements = {};
            measurements['id'] = $('#measId').val();
            measurements['userId'] = userId;
            measurements['measDate'] = dateString[2] + dateString[1] + dateString[0];
            measurements['weight'] = $('#weight').val();
            measurements['stomac'] = $('#stomac').val();
            measurements['fatPtc'] = $('#fatPtc').val();

        if($('#measId')== ""){
            var req = gapi.client.trvagten.insertMeasurements(measurements );
        }else{
            var req = gapi.client.trvagten.updateMeasurements(measurements );
        }
        req.execute( function(measurements ){
            $('#measId').val(measurements['id']);
            $('#datepicker1').val( toNormalDate(measurements.measDate));
            $('#weight').val( measurements.weight);
            $('#stomac').val(measurements.stomac);
            $('#fatPtc').val(measurements.fatPtc);
        });
        var dateFromObj = new Date();
        dateFromObj.setDate(dag.getDate()-14);
        var dateFrom = dateFromObj.getFullYear()+lpad(dateFromObj.getMonth()+1,2)+ lpad(dateFromObj.getDate(),2); //getting the last two weeks
        var dateTo = parseInt(dag.getFullYear()+lpad(dag.getMonth()+1,2)+ lpad(dag.getDate(),2)) //todays date in the format
        getPersonalMeasurements(dateFrom, dateTo, false);
    });

    /*Autehnticate by clicking the Google logo image*/
    $('a#loginAref').click(function(){
        gapi.auth.authorize({client_id: clientId,
            scope: scopes, immediate: false}, handleAuthResult);
        return false;
    });

    $('#btnSavePersonal').button().click(function(){
        if( userId != null ){
            var person = {};
            person['id'] = userId;
            person['fname'] =  $('#fname').val();
            person['lname'] = $('#lastname').val();
            person['gender'] =  $('#gender').prop("selectedIndex" );
            person['priSport'] = $('#sports').val();
            person['height'] =  $('#height').val();
            person['city'] = $('#city').val();;
            person['address'] = $('#address').val();
            person['zipcode'] = $('#zipcode').val();
            person['email'] = $('#email').val();

            var req;
            //req = gapi.client.traeningsvagten.person.insert(person);
            req = gapi.client.trvagten.insertPerson(person);
            req.execute(function (data) {
                $('#email').val(data.email);
                $('#fname').val(data.fname);
                $('#lastname').val(data.lname);
                $('#gender').prop("selectedIndex", parseInt(data.gender));
                $('#height').val(data.height);
                $('#city').val( data.city);
                $('#address').val(data.address);
                $('#zipcode').val(data.zipcode);
                $('#sports').val(data.priSport);
            });
        }
    });

});

/*End the on ducument load stuff Starting of stand alone functions, which the need to be due to JSONP*/

/* object to contain all the stuff from one days consumption. */
function objDailyConsumed(food_id, food_name, food_amount) {
    this.food_id = food_id;
    this.food_name = food_name;
    this.food_amount = food_amount;
}

/*Start JSONP to get food values from the other site*/
function queryFood(searchString) {
    //empty the list
    $('#list').empty();
    var url = "http://traeningsvagten.dk/Services/FoodInfoWebService.asmx/GetFoodInfoJson?nameLike=" + searchString +
        "&random=" + (new Date()).getTime();
    var newScriptElement = document.createElement("script");
    newScriptElement.setAttribute("src", url);
    newScriptElement.setAttribute("id", "jsonp");
    var oldScriptElement = document.getElementById("jsonp");
    var head = document.getElementsByTagName("head")[0];
    if (oldScriptElement == null) {
        head.appendChild(newScriptElement);
    } else {
        head.replaceChild(newScriptElement, oldScriptElement);
    }
}


/*Start JSONP to get nutrients values from the other site and a specific food id*/
function getNutrients(food_id, FoodAmount, FoodDate) {
    var url = "http://traeningsvagten.dk/Services/FoodInfoWebService.asmx/GetNutrientsJson?FoodInfoId="
        + food_id
        + "&FoodAmount=" + FoodAmount
        + "&FoodDate=" + FoodDate
        + "&random=" + (new Date()).getTime();
    var newScriptElement = document.createElement("script");
    newScriptElement.setAttribute("src", url);
    newScriptElement.setAttribute("id", "jsonp");
    var oldScriptElement = document.getElementById("jsonp");
    var head = document.getElementsByTagName("head")[0];
    if (oldScriptElement == null) {
        head.appendChild(newScriptElement);
    } else {
        head.replaceChild(newScriptElement, oldScriptElement);
    }
}



function checkInput(input, type) {
    var retVal = false;
    if (type === "num") {
        if (/^\d+$/.test(input)) {
            if (parseFloat(input) < 1000) {
                retVal = true;
            } else {
                retVal = false;
            }
        } else {
            retVal = false;
        }
    }
    if (!retVal) {
        if (input == "0" || input == "") {
            $('.validateTips').html("");
        } else {
            $('.validateTips').html("Input skal være et tal og mindre en 1000!");
        }
    } else {
        $('.validateTips').html("");
    }
    return retVal;
}


/*is automatically called by the return values from queryFood   */
function updateFood(foodValues) {
    //add the new query result
    for (var i = 0; i < foodValues.length; i++) {
        var singleObject = foodValues[i];
        $('#list').append($("<li></li>")
            .html("<input readonly type='text' class='invisible' position=" + i + " id="
            + singleObject.FoodId + " value='"
            + singleObject.DanName + "' ondblclick=addFunction(this); onkeydown='eventFunction(event)' onfocus='captureLastFocusedInput(this)';   ></input>"));
    }
}


function updateNutrients(nutrients, foodAmount, foodDate) {
    var amount = parseFloat(foodAmount) / 100; //forholdstal for mængden pr 100 gram.
    for (i = 0; i < nutrients.length; i++) {
        switch (nutrients[i].compid) {
            case "0000":
                totEnergy += parseFloat(nutrients[i].BestLoc) * amount;
                $('#energy').html(totEnergy.toFixed(2).toString());
                break;
            case "0001":
                totProtein += parseFloat(nutrients[i].BestLoc) * amount;
                $('#protein').html(totProtein.toFixed(2).toString());
                break;
            case "0003":
                totFat += parseFloat(nutrients[i].BestLoc) * amount;
                $('#fat').html(totFat.toFixed(2).toString());
                break;
            case "0004":
                totSatFat += parseFloat(nutrients[i].BestLoc) * amount;
                $('#satfat').html(totSatFat.toFixed(2).toString());
            case "0005":
                totMonoUnsatFat += parseFloat(nutrients[i].BestLoc) * amount;
                $('#monounsatfat').html(totSatFat.toFixed(2).toString());
                break;
            case "0007":
                totCarbo += parseFloat(nutrients[i].BestLoc) * amount;
                $('#carbohydrates').html(totMonoUnsatFat.toFixed(2).toString());
                break;
            case "0010":
                totFiber += parseFloat(nutrients[i].BestLoc) * amount;
                $('#fiber').html(totFiber.toFixed(2).toString());
                break
            case "0011":
                totAlcohol += parseFloat(nutrients[i].BestLoc) * amount;
                $('#alcohol').html(totAlcohol.toFixed(2).toString());
                break;
            case "0013":
                totWater += parseFloat(nutrients[i].BestLoc) * amount;
                $('#water').html(totWater.toFixed(2).toString());
                break;
            case "0223":
                totCholesterol += parseFloat(nutrients[i].BestLoc) * amount;
                $('#cholesterol').html(totCholesterol.toFixed(2).toString());
                break;
            case "0056":
                totSodium += parseFloat(nutrients[i].BestLoc) * amount;
                $('#sodium').html(totSodium.toFixed(2).toString());
                break;
            case "0057":
                totPotassium += parseFloat(nutrients[i].BestLoc) * amount;
                $('#potassium').html(totPotassium.toFixed(2).toString());
            case "0059":
                totMagnesium += parseFloat(nutrients[i].BestLoc) * amount;
                $('#magnesium').html(totMagnesium.toFixed(2).toString());
                break;
            case "0061":
                totIron += parseFloat(nutrients[i].BestLoc) * amount;
                $('#iron').html(totIron.toFixed(2).toString());
                break;
        }
    }
    totAmount += parseFloat(foodAmount);
    $('#totalAmount').html(totAmount.toString());

}

var lpad = function (value, padding) {
    var zeroes = "0";
    for (var i = 0; i < padding; i++) {
        zeroes += "0";
    }
    return (zeroes + value).slice(padding * -1);
}


/*Get the double click event from the results of the query*/
function addFunction(selObj) {
    //alert( $(selectedObject).attr("id") );
    if($(selObj).attr("position") != null){
        openDialog($(selObj));
    }else{
        //Remove the element and li from the DOM
        var dateString = $('#datepicker').val().split("/");
        getNutrients($(selObj).attr("id"),"-"+parseInt($(selObj).attr("amount")),dateString[2] + dateString[1] + dateString[0]);
        $("#remove_"+$(selObj).attr("id")).remove();
    }

}


/*catch the keykodes from the results of the query*/
function eventFunction(e) {
    var curpos = parseInt($(e.target).attr("position"));
    switch (e.keyCode) {
        case $.ui.keyCode.ENTER:
            //alert( $(e.target).attr("id") + $(e.target).val() );
            openDialog($(e.target));
            break;
        case $.ui.keyCode.DOWN: //the down arrow
            $("*[position=" + (curpos + 1).toString() + "]").focus();
            break;
        case $.ui.keyCode.UP: //the up arrow
            $("*[position=" + (curpos - 1).toString() + "]").focus();
            break;
    }
}

function openDialog(selObj) {
    //change the text in the popup dialog
    curSelFoodObj = selObj;
    if ($(selObj).attr("position") != null) {
        $('p#popTextAdd').html("Skriv hvor mange gram af:<br>" + selObj.val());
        //open the dialog
        $('#amount').val("");
        $("#dialog-form").dialog("open");
    }
}

function addToDay(amount) {
    var ifExists = false;
    if (curSelFoodObj != null) {
        /*check if the id is already there, if it is add it to the existing*/
        $(".inDayList").each(function (index) {
            var inputField = this;
            var id = $(this).attr("id");
            if (id == $(curSelFoodObj).attr("id")) {
                ifExists = true;
                var oldAmount = parseFloat($(this).attr("amount"));
                var newAmount = oldAmount + parseFloat(amount);
                var foodText = $(this).val().substr(3);
                foodText = lpad(newAmount, 3) + foodText;
                $(this).attr("amount", newAmount);
                $(this).val(foodText);
                var dateString = $('#datepicker').val().split("/");
                getNutrients(id, amount, dateString[2] + dateString[1] + dateString[0]);

            }
        });

        /*a new one we add it*/
        if (!ifExists) {
            $(curSelFoodObj).removeAttr("position");
            $(curSelFoodObj).attr("amount", amount);
            var foodText = $(curSelFoodObj).val();
            foodText = lpad(amount, 3) + "g " + foodText;
            $(curSelFoodObj).val(foodText);
            $(curSelFoodObj).addClass( "inDayList" );
            $('#listDay').append($("<li id=remove_" + $(curSelFoodObj).attr("id") + "></li>")
                .html(curSelFoodObj));
            var dateString = $('#datepicker').val().split("/");
            getNutrients($(curSelFoodObj).attr("id"), amount, dateString[2] + dateString[1] + dateString[0]);
        }
        curSelFoodObj = null;
        focusedInput = null;
    }
}

function captureLastFocusedInput( fip ){
    focusedInput = fip;
}

/*the authentication stuff first load the google authentication API*/
function loadGapi() {
    // Set the API key
    gapi.client.setApiKey(apiKey);
    window.setTimeout(checkAuth,1000);
    // Set: name of service, version and callback function
    //gapi.client.load('traeningsvagten', 'v1', getPersons);
    gapi.client.load('trvagten', 'v1');
}

/*Check if we are autehnticated yet*/
function checkAuth() {
        gapi.auth.authorize({client_id: clientId,
            scope: scopes, immediate: true}, handleAuthResult);
}

function handleAuthResult(authResult) {
    var authorizeText = $('#loginGoogle');
    if (authResult) {
        //authorizeText.html("Logget ind med Google!");
        var token = gapi.auth.getToken();
        $.getJSON('https://www.googleapis.com/oauth2/v1/tokeninfo?&access_token='+token.access_token, loggedIn);
    } else {
        authorizeText.html("Log ind med Google!");
    }
}

//the JSONP call back method, seems to stabilize it, still will not work in ie9?
function loggedIn( data ){
    var authorizeText = $('#loginGoogle');
    if( clientId === data.audience  ){
        userId = data.user_id;
        authorizeText.html("Logget ind med Google!");
        getPersonal( userId );
        var dateFromObj = new Date();
        dateFromObj.setDate(dag.getDate()-14);
        var dateFrom = dateFromObj.getFullYear()+lpad(dateFromObj.getMonth()+1,2)+ lpad(dateFromObj.getDate(),2); //getting the last two weeks
        var dateTo = parseInt(dag.getFullYear()+lpad(dag.getMonth()+1,2)+ lpad(dag.getDate(),2)) //todays date in the format
        getPersonalMeasurements(dateFrom, dateTo, true);
    }else{
        alert( "Something wrong in token identification!" )
    }
}
//get the user from the database if it exists
function getPersonal(user ){
    var req = gapi.client.trvagten.getPerson({'id':userId });
    try{
    req.execute(function (data) {
        if( data.id ){
            $('#email').val(data.email);
            $('#fname').val(data.fname);
            $('#lastname').val(data.lname);
            $('#gender').prop("selectedIndex",parseInt(data.gender));
            $('#height').val(data.height);
            $('#city').val( data.city);
            $('#address').val(data.address);
            $('#zipcode').val(data.zipcode);
            $('#sports').val(data.priSport);
        }
    });
    }catch ( err ){
        console.error( err.toString());

    }

}
//get the measurements for the last 30 days, if they are available
function getPersonalMeasurements(dateFrom, dateTo, doUpdate) {
    var req = gapi.client.trvagten.listMeasurements({'userId':userId, 'dateFrom':dateFrom, 'dateTo':dateTo });
    req.execute(function (data) {
        var d1 = [];
        var d2 = [];
        var d3 = [];
        for (i = 0; i < data.items.length; i++) {
            d1.push([i, data.items[i].weight]);
            d2.push([i, data.items[i].stomac]);
            d3.push([i, data.items[i].fatPtc]);
        }
        $.plot($("#graphWeight"), [d1 ], {
            grid:{borderWidth:0}
        });
        $.plot($("#graphStomac"), [d2 ], {
            grid:{borderWidth:0}
        });
        $.plot($("#graphFat"), [d3 ], {
            grid:{borderWidth:0}
        });

        //should the personal measurements form be updated?
        if (doUpdate) {
            data.items.sort(function (a, b) {
                return parseInt(a.measDate) - parseInt(b.measDate)
            });
            var latestMeas = data.items[data.items.length - 1];
            //set the form with the latest figures if there are any for this day (maybe).
            $('#measId').val(latestMeas.id);
            $('#datepicker1').val(toNormalDate(latestMeas.measDate));
            $('#weight').val(latestMeas.weight);
            $('#stomac').val(latestMeas.stomac);
            $('#fatPtc').val(latestMeas.fatPtc);
        }
    });
}

//get food consumption for on day and fill the list and the consumption table.
function getFood(date) {
    $('#listDay').empty();
    var req = gapi.client.trvagten.getFood({'id':date, 'userId':userId});
    req.execute(function (data) {
        if (data) {
            var cons = JSON.parse(data.consumed.value);
            if (cons) {
                for (i = 0; i < cons.length; i++) {
                    getNutrients(cons[i].foodId, cons[i].foodWeight, cons[i].foodDate);

                    $('#listDay').append($("<li id=remove_" + cons[i].foodId + " ></li>")
                        .html("<input readonly type='text' class='invisible, inDayList' id="
                        + cons[i].foodId + " amount=" + cons[i].foodWeight + " value='"
                        + cons[i].foodName + "' ondblclick=addFunction(this); onkeydown='eventFunction(event)' onfocus='captureLastFocusedInput(this)';   ></input>"));
                }
            }
        }

    });
}


function toNormalDate( storeDate ){
    return storeDate.toString().substr(6, 2) +"/"+storeDate.toString().substr(4, 2)+"/"+storeDate.toString().substr(0, 4)
}