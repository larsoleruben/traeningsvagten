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

/*Start the load function to set everything up*/
$(document).ready(function () {

    var test =  { "client": {}, "googleapis.config": { root: "https://datavagten.appspot.com/_ah/api"  }  }

    /* Start load function Declarations */

    var dag = new Date();


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

    /*testing the graph interfacew*/
    $(function () {
        var d1 = [];
        var d2 = [];
        var d3 = [];
        var test = 75;
        for (var i = 0; i < 30; i += 1){
            test -= Math.random();
            d1.push([i, test]);
            d2.push([i, 90 + 2*Math.random()])
            d3.push([i, 15 + 2*Math.random()])
        }

        //var d2 = [[0, 3], [4, 8], [8, 5], [9, 13]];

        // a null signifies separate line segments
        //var d3 = [[0, 12], [7, 12], null, [7, 2.5], [12, 2.5]];

        $.plot($("#graphWeight"), [d1 ],{
            grid:{borderWidth: 0}
        });
        $.plot($("#graphStomac"), [d2 ],{
            grid:{borderWidth: 0}
        });
        $.plot($("#graphFat"), [d3 ],{
            grid:{borderWidth: 0}
        });

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


    $('#datepicker').val( lpad(dag.getDate(),2) + '/' + lpad(dag.getMonth()+1,2) + '/' + dag.getFullYear());
    $("#datepicker").datepicker();
    $('#datepicker1').val( lpad(dag.getDate(),2) + '/' + lpad(dag.getMonth()+1,2) + '/' + dag.getFullYear());
    $('#datepicker1').datepicker();

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

    $('#saveDayButton').button();

    $('#saveMeasBtn').button();

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