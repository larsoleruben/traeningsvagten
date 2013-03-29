/**
 * Created with JetBrains WebStorm.
 * User: lars
 * Date: 12/14/12
 * Time: 7:19 PM
 * To change this template use File | Settings | File Templates.
 */

/*some global vars of different kinds*/
var focusedInput = null;
/*Currently selected object when choosing the element of the day*/
var curSelFoodObj = null;
var totConsumedOBJ = { 'totEnergy':0, 'totFat':0, 'totCarbo':0, 'totProtein':0, 'totAlcohol':0, 'totFiber':0, 'totCholesterol':0, 'totSatFat':0,
    'totMonoUnsatFat':0, 'totSodium':0, 'totPotassium':0, 'totMagnesium':0, 'totIron':0, 'totWater':0, 'totAmount':0 }  //array to hold daily consumption of food

/*Google authentication stuff*/
var clientId = "175552442718.apps.googleusercontent.com";
var apiKey = 'AIzaSyCR1g1KlqQBGLbu7c4BmknWCD3X7_Tu0Jk';
var scopes = ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile" ];
var ROOT = "http://localhost:8888/_ah/api";  //select the appropiate root, test or production
//var ROOT = "https://datavagten.appspot.com/_ah/api";
var userId = null; //is set on the first log in and by authentication

//todays date
var dag;

//plots
var plot1;
var plot2;
var plot3;

/*Start the load function to set everything up*/
$(document).ready(function () {

    if ($.browser.msie) {
        if (parseInt($.browser.version.substr(0, 2)) < 10) {
            $('#checkForIe').dialog("open");
            $('#oldMsieBrowser').toggle();
        }
    }

    //var test =  { "client": {}, "googleapis.config": { root: "https://datavagten.appspot.com/_ah/api"  }  }
    //initialising empty plots
    plot1 = $.plot($("#graphWeight"), [
        [0, 0]
    ], {
        grid:{borderWidth:0}
    });
    plot2 = $.plot($("#graphStomac"), [
        [0, 0]
    ], {
        grid:{borderWidth:0}
    });
    plot3 = $.plot($("#graphFat"), [
        [0, 0]
    ], {
        grid:{borderWidth:0}
    });

    /* Start load function Declarations */

    dag = new Date();


    /*End load function Declarations*/

    /*initialize visibility setting*/
    $('#personalDetails').show();
    $('#measurements').show();
    $('#weigtGraph').show();
    $('#traeningLeft').hide();
    $('#traeningCenter').hide();
    $('#traeningGraph').hide();
    $('#searchFood').hide();
    $('#consumedToday').hide();
    $('#tableDigesting').hide();
    $('#dashboard').addClass("selected");
    $('#food').removeClass("selected");
    $('#traening').removeClass("selected");
    $('#loading').hide();
    /*Show if the browser is not supported*/
    $('#oldMsieBrowser').hide();


    $(function () {
        $(document).tooltip({
            position:{
                my:"center bottom-20",
                at:"center top"
            }
        });
    });

    $('#search').focus();

    /*Setting up the menu and the default pages*/
    /*TODO Make this generic somehow. This is a little too error prone.*/
    $('#dashboard').click(function () {
        $('#searchFood').hide();
        $('#consumedToday').hide();
        $('#tableDigesting').hide();
        $('#traeningLeft').hide();
        $('#traeningCenter').hide();
        $('#traeningGraph').hide();
        $('#personalDetails').show();
        $('#measurements').show();
        $('#weigtGraph').show();
        $('#dashboard').addClass("selected");
        $('#food').removeClass("selected");
        $('#traening').removeClass("selected");


    });

    $('#food').click(function () {
        $('#searchFood').show();
        $('#consumedToday').show();
        $('#tableDigesting').show();
        $('#personalDetails').hide();
        $('#traeningLeft').hide();
        $('#traeningCenter').hide();
        $('#traeningGraph').hide();
        $('#measurements').hide();
        $('#weigtGraph').hide();
        $('#dashboard').removeClass("selected");
        $('#traening').removeClass("selected");
        $('#food').addClass("selected");
    });

    $('#traening').click(function () {
        $('#searchFood').hide();
        $('#consumedToday').hide();
        $('#tableDigesting').hide();
        $('#personalDetails').hide();
        $('#measurements').hide();
        $('#weigtGraph').hide();
        $('#traeningLeft').show();
        $('#traeningCenter').show();
        $('#traeningGraph').show();
        $('#dashboard').removeClass("selected");
        $('#food').removeClass("selected");
        $('#traening').addClass("selected");
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
            if (focusedInput != null) {
                openDialog($(focusedInput));
            }
        });
    /*End modal popup form*/

    //setting up the datepicker for food
    $('#datepicker').val(lpad(dag.getDate(), 2) + '/' + lpad(dag.getMonth() + 1, 2) + '/' + dag.getFullYear());
    $("#datepicker").datepicker({ dateFormat:"dd/mm/yy" });
    //Catching the datepicker change events
    $('#datepicker').change(function () {
        var counter = 0;
        var rows = $("#consumedTable tr:gt(0)"); // skip the header row
        rows.each(function (index) {
            this.cells[1].innerHTML = "0.00";
        });
        var keys = Object.keys(totConsumedOBJ);
        for (var i = keys.length; i--;) {
            totConsumedOBJ[keys[i]] = 0;
        }
        var dateString = $('#datepicker').val().split("/");
        getFood(dateString[2] + dateString[1] + dateString[0]);

    });


    //setting up the datepicker1 personal measurements
    $('#datepicker1').val(lpad(dag.getDate(), 2) + '/' + lpad(dag.getMonth() + 1, 2) + '/' + dag.getFullYear());
    $('#datepicker1').datepicker({ dateFormat:"dd/mm/yy" });

    //Catching the datepicker 1 change events
    $('#datepicker1').change(function () {
        var dateString = $('#datepicker1').val().split("/");
        //The same date both to and from
        var dateFrom = dateString[2] + dateString[1] + dateString[0];
        var dateTo = dateString[2] + dateString[1] + dateString[0];
        var req = gapi.client.trvagten.listMeasurements({'userId':userId, 'dateFrom':dateFrom, 'dateTo':dateTo });
        $('#measurements').mask("Loading...", 100);
        try {
            req.execute(function (data) {
                $('#measurements').unmask();
                if (data.items && data.items.length > 0) {
                    $('#measId').val(data.items[0].id);
                    $('#datepicker1').val(toNormalDate(data.items[0].measDate));
                    $('#weight').val(data.items[0].weight);
                    $('#stomac').val(data.items[0].stomac);
                    $('#fatPtc').val(data.items[0].fatPtc);
                } else //reset everything to zero except the datepicker field
                {
                    $('#measId').val("");
                    $('#weight').val("");
                    $('#stomac').val("");
                    $('#fatPtc').val("");
                }
            });
        } catch (err) {
            console.error(err.toString());
            $('#measurements').unmask();
        }
    });

    $('#search').keypress(function (e) {
        if (e.keyCode == $.ui.keyCode.ENTER) {
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

    $('#saveDayButton').button().click(function () {
        //declaring the objects for the json string
        var consumed = []; //array to hold the consumed objects
        var food = {}; //object for hold the consumed array and other id's
        var dateString = $('#datepicker').val().split("/");
        food.id = $('#foodDayId').val();
        food.userId = userId;
        food.foodDate = dateString[2] + dateString[1] + dateString[0];
        $(".inDayList").each(function (index) {
            var item = {};
            item.foodId = $(this).attr("id");
            item.foodWeight = $(this).attr("amount");
            item.foodName = $(this).val();
            consumed.push(item);
        });
        food.consumed = JSON.stringify(consumed)
        $('#consumedToday').mask("Saving...", 500);
        if ($('#foodDayId').val() != null) {
            var req = gapi.client.trvagten.insertFood(food);
        } else {
            var req = gapi.client.trvagten.updateFood(food);
        }
        try {
            req.execute(function (foodData) {
                $('#foodDayId').val(foodData.id);
                $('#consumedToday').unmask();
            });
        } catch (err) {
            console.error(err.toString());
            $('#consumedToday').unmask();
        }
    });

    //saving the personal measurements for one day
    $('#saveMeasBtn').button().click(function () {
        if (validateInput("measurements")) {
            var dateString = $('#datepicker1').val().split("/");
            var measurements = {};
            measurements['id'] = $('#measId').val();
            measurements['userId'] = userId;
            measurements['measDate'] = dateString[2] + dateString[1] + dateString[0];
            measurements['weight'] = $('#weight').val();
            measurements['stomac'] = $('#stomac').val();
            measurements['fatPtc'] = $('#fatPtc').val();

            if ($('#measId') == "") {
                var req = gapi.client.trvagten.insertMeasurements(measurements);
            } else {
                var req = gapi.client.trvagten.updateMeasurements(measurements);
            }
            try {
                $('#measurements').mask("Saving...", 100);
                req.execute(function (measurements) {
                    $('#measId').val(measurements['id']);
                    $('#datepicker1').val(toNormalDate(measurements.measDate));
                    $('#weight').val(measurements.weight);
                    $('#stomac').val(measurements.stomac);
                    $('#fatPtc').val(measurements.fatPtc);
                    var dateFromObj = new Date();
                    dateFromObj.setDate(dag.getDate() - 14);
                    var dateFrom = dateFromObj.getFullYear() + lpad(dateFromObj.getMonth() + 1, 2) + lpad(dateFromObj.getDate(), 2); //getting the last two weeks
                    var dateTo = parseInt(dag.getFullYear() + lpad(dag.getMonth() + 1, 2) + lpad(dag.getDate(), 2)) //todays date in the format
                    $('#measurements').unmask();
                    getPersonalMeasurements(dateFrom, dateTo, false);
                });
            } catch (err) {
                console.error(err.toString());
                $('#measurements').unmask();
            }
        } else {
            $('#inputValidatorDialog').dialog("open");
        }

    });

    /*Autehnticate by clicking the Google logo image*/
    $('a#loginAref').click(function () {
        gapi.auth.authorize({client_id:clientId,
            scope:scopes, immediate:false}, handleAuthResult);
        return false;
    });

    $('#btnSavePersonal').button().click(function () {
        if (userId != null && validateInput("personal")) {
            $('#personalDetails').mask("Loading...", 1000);
            var person = {};
            person['id'] = userId;
            person['fname'] = $('#fname').val();
            person['lname'] = $('#lastname').val();
            person['gender'] = $('#gender').prop("selectedIndex");
            person['priSport'] = $('#sports').val();
            person['height'] = $('#height').val();
            person['city'] = $('#city').val();
            person['address'] = $('#address').val();
            person['zipcode'] = $('#zipcode').val();
            person['email'] = $('#email').val();
            person['restMetabolism'] = $('#restMetabolism').val();

            var req;
            //req = gapi.client.traeningsvagten.person.insert(person);
            try {
                req = gapi.client.trvagten.insertPerson(person);
                req.execute(function (data) {
                    $('#personalDetails').unmask();
                    $('#email').val(data.email);
                    $('#fname').val(data.fname);
                    $('#lastname').val(data.lname);
                    $('#gender').prop("selectedIndex", parseInt(data.gender));
                    $('#height').val(data.height);
                    $('#city').val(data.city);
                    $('#address').val(data.address);
                    $('#zipcode').val(data.zipcode);
                    $('#sports').val(data.priSport);
                    $('#restMetabolism').val(data.restMetabolism);
                });
            } catch (err) {
                console.error(err.toString());
                $('#personalDetails').unmask();
            }
        } else {
            //alert( "log ind først");
            $('#personalDetails').unmask();
            $('#inputValidatorDialog').dialog("open");
        }
    });

    /*All the save training stuff from here*/
    $('#saveTraeningBtn').button().click(function () {
        if (validateInput("training")) {
            var dateString = $('#datepicker2').val().split("/");
            var traening = {};
            traening.id = $('#traeningId').val();
            traening.userId = userId;
            traening.doneDate = dateString[2] + dateString[1] + dateString[0];
            traening.trainingType = $('#traeningType').prop("selectedIndex");
            traening.totalTimeMin = $('#total').val();
            traening.maxTime = $('#max').val();
            traening.atTime = $('#at').val();
            traening.subAtTime = $('#subAt').val();
            traening.fs = $('#fs').val();
            traening.power = $('#power').val();
            traening.ig = $('#ig').val();
            traening.distance = $('#dist').val();
            traening.energy = $('#UsedEnergy').val();
            traening.comments = $('#comments').val();
            traening.place = $('#place').val();
            traening.percievedIntensity = $('#percievedIntensity').val();
            /*save or update the training session*/
            $('#traeningCenter').mask("Loading...", 1000);
            if ($('#traeningId').val() == null) {
                var req;
                req = gapi.client.trvagten.insertTraening(traening);
                req.execute(function (data) {
                    $('#traeningCenter').unmask();
                    fillTraining(data);
                });
            } else {
                var req;
                req = gapi.client.trvagten.updateTraening(traening);
                req.execute(function (data) {
                    $('#traeningCenter').unmask();
                    fillTraining(data);
                });
            }
        } else {
            $('#traeningCenter').unmask();
            $('#inputValidatorDialog').dialog("open");
    }

    });

    $('#trType').button();
    //setting up the datepicker1 traening measurements
    $('#datePicker2').datepicker();
    $('#datepicker2').val(lpad(dag.getDate(), 2) + '/' + lpad(dag.getMonth() + 1, 2) + '/' + dag.getFullYear());
    $('#datepicker2').datepicker({ dateFormat:"dd/mm/yy" });
    $('#datepicker2').change(function () {
        var dateString = $('#datepicker2').val().split("/");
        var dateFrom = dateString[2] + dateString[1] + dateString[0];
        var dateTo = dateString[2] + dateString[1] + dateString[0];
        var req = gapi.client.trvagten.listTraening({'userId':userId, 'dateFrom':dateFrom, 'dateTo':dateTo });
        $('#traeningCenter').mask("Loading...", 500);
        req.execute(function (data) {
            $('#traeningCenter').unmask();
            if (data.items && data.items.length == 1) {
                fillTraining(data.items[0]);
            } else {
                $('#traeningId').val("");
                emptyTraining();
            }
        });
    });

    $('#datePicker3').datepicker();
    $('#datepicker3').val(lpad(dag.getDate(), 2) + '/' + lpad(dag.getMonth() + 1, 2) + '/' + dag.getFullYear());
    $('#datepicker3').datepicker({ dateFormat:"dd/mm/yy" });

    $('#datePicker4').datepicker();
    $('#datepicker4').val(lpad(dag.getDate(), 2) + '/' + lpad(dag.getMonth() + 1, 2) + '/' + dag.getFullYear());
    $('#datepicker4').datepicker({ dateFormat:"dd/mm/yy" });


    $('#getTraning').button().click(function () {
        /*empty the table*/
        $("#tblTrSessions tbody").empty();
        /*Fill it again with new data*/
        var dateString3 = $('#datepicker3').val().split("/");
        var dateString4 = $('#datepicker4').val().split("/");
        var dateFrom = dateString3[2] + dateString3[1] + dateString3[0];
        var dateTo = dateString4[2] + dateString4[1] + dateString4[0];
        var req = gapi.client.trvagten.listTraening({'userId':userId, 'dateFrom':dateFrom, 'dateTo':dateTo });
        $('#trSessions').mask("Loading....", 100);
        try {
            req.execute(function (data) {
                $('#trSessions').unmask();
                data.items.sort(function (a, b) {
                    return parseInt(a.doneDate) - parseInt(b.doneDate)
                });
                var dlFile = "Download data from "+ $('#datepicker3').val() + " to "+$('#datepicker4').val()+"\n";
                dlFile += 'Dato,Type,Total Tid,Tid i Max Zone, Tid i AT Zone, Tid i Sub At Zone, Tid i Intensiv Grundtræning Zone, Tid med Power, Funktionel Styrketræning gentagelser' +
                    ' Distance, Energi, Sted, Intensitet, Kommnetarer \n';
                for (i = 0; i < data.items.length; i++) {
                    $("#tblTrSessions tbody").append("<tr>" +
                        "<td>" + data.items[i].doneDate + "</td>" +
                        "<td>" + $('#traeningType option')[parseInt(data.items[i].trainingType)].innerHTML + "</td>" +
                        "<td>" + data.items[i].totalTimeMin + "</td>" +
                        "<td>" + data.items[i].maxTime + "</td>" +
                        "<td>" + data.items[i].atTime + "</td>" +
                        "<td>" + data.items[i].subAtTime + "</td>" +
                        "<td>" + data.items[i].ig + "</td>" +
                        "<td>" + data.items[i].power + "</td>" +
                        "<td>" + data.items[i].fs + "</td>" +
                        "<td>" + data.items[i].distance + "</td>" +
                        "<td>" + data.items[i].energy + "</td>" +
                        "<td>" + data.items[i].place + "</td>" +
                        "<td>" + data.items[i].percievedIntensity + "</td>" +
                        "<td>" + data.items[i].comments + "</td>" +
                        "</tr>");
                    dlFile = dlFile + data.items[i].doneDate +','+ data.items[i].totalTimeMin+','+data.items[i].maxTime+','+data.items[i].atTime+','+data.items[i].subAtTime
                                    + ','+data.items[i].ig+','+data.items[i].power+','+data.items[i].fs+','+data.items[i].distance+','+data.items[i].energy+','+data.items[i].place
                                    +','+data.items[i].percievedIntensity+','+data.items[i].comments+'\n';
                }
                var dlData="<a href='data:text;charset=utf-8,"+ encodeURI(dlFile)+"' >Download dine data og gem som .csv fil</a>";
                $('#dlLink').html( dlData);
            });
            $("#trSessions").dialog("open");
        } catch (err) {
            $('#trSessions').mask("Loading....", 100);
            console.error(err.toString());
        }
    });

    $("#trSessions").dialog({
        autoOpen:false,
        hide:"explode",
        height:300,
        width:1200,
        modal:true
    });

    /*End All the save training stuff from here*/

    /*validation dialog*/

    $('#inputValidatorDialog').dialog({
        autoOpen:false,
        hide:"explode",
        height:200,
        width:300,
        modal:true
    });

    /*Browser validation dialog*/
    $('#checkForIe').dialog(
        {
            autoOpen:false,
            hide:"explode",
            height:200,
            width:300,
            modal:true
        }
    )

});

/***********************************************************************************************************************/
/*End the on ducument load stuff Starting of stand alone functions, which the need to be due to JSONP                   */
/***********************************************************************************************************************/

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


/*works only for the pop up dialog when adding food :-( TODO improve*/
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
            .html("<input readonly type='text' class='invisible' title='Dobbelklik for at tilføje' position=" + i + " id="
            + singleObject.FoodId + " value='"
            + singleObject.DanName + "' ondblclick=addFunction(this); onkeydown='eventFunction(event)' onfocus='captureLastFocusedInput(this)';   ></input>"));
    }
    $('#searchFood').unmask();
}


function updateNutrients(nutrients, foodAmount, foodDate) {
    var amount = parseFloat(foodAmount) / 100; //forholdstal for mængden pr 100 gram.
    for (i = 0; i < nutrients.length; i++) {
        switch (nutrients[i].compid) {
            case "0000":
                totConsumedOBJ.totEnergy += parseFloat(nutrients[i].BestLoc) * amount;
                $('#energy').html(totConsumedOBJ.totEnergy.toFixed(2).toString());
                break;
            case "0001":
                totConsumedOBJ.totProtein += parseFloat(nutrients[i].BestLoc) * amount;
                $('#protein').html(totConsumedOBJ.totProtein.toFixed(2).toString());
                break;
            case "0003":
                totConsumedOBJ.totFat += parseFloat(nutrients[i].BestLoc) * amount;
                $('#fat').html(totConsumedOBJ.totFat.toFixed(2).toString());
                break;
            case "0004":
                totConsumedOBJ.totSatFat += parseFloat(nutrients[i].BestLoc) * amount;
                $('#satfat').html(totConsumedOBJ.totSatFat.toFixed(2).toString());
            case "0005":
                totConsumedOBJ.totMonoUnsatFat += parseFloat(nutrients[i].BestLoc) * amount;
                $('#monounsatfat').html(totConsumedOBJ.totSatFat.toFixed(2).toString());
                break;
            case "0007":
                totConsumedOBJ.totCarbo += parseFloat(nutrients[i].BestLoc) * amount;
                $('#carbohydrates').html(totConsumedOBJ.totMonoUnsatFat.toFixed(2).toString());
                break;
            case "0010":
                totConsumedOBJ.totFiber += parseFloat(nutrients[i].BestLoc) * amount;
                $('#fiber').html(totConsumedOBJ.totFiber.toFixed(2).toString());
                break
            case "0011":
                totConsumedOBJ.totAlcohol += parseFloat(nutrients[i].BestLoc) * amount;
                $('#alcohol').html(totConsumedOBJ.totAlcohol.toFixed(2).toString());
                break;
            case "0013":
                totConsumedOBJ.totWater += parseFloat(nutrients[i].BestLoc) * amount;
                $('#water').html(totConsumedOBJ.totWater.toFixed(2).toString());
                break;
            case "0223":
                totConsumedOBJ.totCholesterol += parseFloat(nutrients[i].BestLoc) * amount;
                $('#cholesterol').html(totConsumedOBJ.totCholesterol.toFixed(2).toString());
                break;
            case "0056":
                totConsumedOBJ.totSodium += parseFloat(nutrients[i].BestLoc) * amount;
                $('#sodium').html(totConsumedOBJ.totSodium.toFixed(2).toString());
                break;
            case "0057":
                totConsumedOBJ.totPotassium += parseFloat(nutrients[i].BestLoc) * amount;
                $('#potassium').html(totConsumedOBJ.totPotassium.toFixed(2).toString());
            case "0059":
                totConsumedOBJ.totMagnesium += parseFloat(nutrients[i].BestLoc) * amount;
                $('#magnesium').html(totConsumedOBJ.totMagnesium.toFixed(2).toString());
                break;
            case "0061":
                totConsumedOBJ.totIron += parseFloat(nutrients[i].BestLoc) * amount;
                $('#iron').html(totConsumedOBJ.totIron.toFixed(2).toString());
                break;
        }
    }
    totConsumedOBJ.totAmount += parseFloat(foodAmount);
    $('#totalAmount').html(totConsumedOBJ.totAmount.toString());

}


/*Get the double click event from the results of the query*/
function addFunction(selObj) {
    //alert( $(selectedObject).attr("id") );
    if ($(selObj).attr("position") != null) {
        openDialog($(selObj));
    } else {
        //Remove the element and li from the DOM
        var dateString = $('#datepicker').val().split("/");
        getNutrients($(selObj).attr("id"), "-" + parseInt($(selObj).attr("amount")), dateString[2] + dateString[1] + dateString[0]);
        $("#remove_" + $(selObj).attr("id")).remove();
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
            $(curSelFoodObj).addClass("inDayList");
            $('#listDay').append($("<li id=remove_" + $(curSelFoodObj).attr("id") + "></li>")
                .html(curSelFoodObj));
            var dateString = $('#datepicker').val().split("/");
            getNutrients($(curSelFoodObj).attr("id"), amount, dateString[2] + dateString[1] + dateString[0]);
        }
        curSelFoodObj = null;
        focusedInput = null;
    }
}

function captureLastFocusedInput(fip) {
    focusedInput = fip;
}

/*the authentication stuff first load the google authentication API*/
function loadGapi() {
    // Set the API key
    gapi.client.setApiKey(apiKey);
    window.setTimeout(checkAuth, 1000);
    // Set: name of service, version and callback function
    //gapi.client.load('traeningsvagten', 'v1', getPersons);
    //gapi.client.load('trvagten', 'v1');
    gapi.client.load('trvagten', 'v1', function(){}, ROOT);
}

/*Check if we are autehnticated yet*/
function checkAuth() {
    gapi.auth.authorize({client_id:clientId,
        scope:scopes, immediate:true}, handleAuthResult);
}

function handleAuthResult(authResult) {
    var authorizeText = $('#loginGoogle');
    if (authResult) {
        //authorizeText.html("Logget ind med Google!");
        var token = gapi.auth.getToken();
        $.getJSON('https://www.googleapis.com/oauth2/v1/tokeninfo?&access_token=' + token.access_token, loggedIn);
    } else {
        authorizeText.html("Log ind med Google!");
    }
}

//the JSONP call back method, seems to stabilize it, still will not work in ie9?
function loggedIn(data) {
    var authorizeText = $('#loginGoogle');
    if (clientId === data.audience) {
        userId = data.user_id;
        authorizeText.html("Logget ind med Google!");
        getPersonal(userId);
        var dateFromObj = new Date();
        dateFromObj.setDate(dag.getDate() - 14);
        var dateFrom = dateFromObj.getFullYear() + lpad(dateFromObj.getMonth() + 1, 2) + lpad(dateFromObj.getDate(), 2); //getting the last two weeks
        var dateTo = parseInt(dag.getFullYear() + lpad(dag.getMonth() + 1, 2) + lpad(dag.getDate(), 2)) //todays date in the format
        getPersonalMeasurements(dateFrom, dateTo, true);
        //initialize the food selection for the actual day;
        var initDateString = $('#datepicker').val().split("/");
        getFood(initDateString[2] + initDateString[1] + initDateString[0]);
        //initialize the traening section
        $('#traeningCenter').mask("Loading...", 500);
        var req = gapi.client.trvagten.listTraening({'userId':userId, 'dateFrom':dateTo, 'dateTo':dateTo });
        req.execute(function (data) {
            if (data.items && data.items.length == 1) {
                fillTraining(data.items[0]);
                $('#traeningCenter').unmask();
            } else {
                $('#traeningId').val("");
                emptyTraining();
                $('#traeningCenter').unmask();
            }
        });

    } else {
        alert("Something wrong in token identification!")
    }
}
//get the user from the database if it exists
function getPersonal(user) {
    var req = gapi.client.trvagten.getPerson({'id':userId });
    $('#personalDetails').mask("Loading...", 1000);
    try {
        req.execute(function (data) {
            $('#personalDetails').unmask();
            if (data.id) {
                $('#email').val(data.email);
                $('#fname').val(data.fname);
                $('#lastname').val(data.lname);
                $('#gender').prop("selectedIndex", parseInt(data.gender));
                $('#height').val(data.height);
                $('#city').val(data.city);
                $('#address').val(data.address);
                $('#zipcode').val(data.zipcode);
                $('#sports').val(data.priSport);
                $('#restMetabolism').val(data.restMetabolism);
            }
        });
    } catch (err) {
        $('#personalDetails').unmask();
        console.error(err.toString());
    }

}
//get the measurements for the last 30 days, if they are available
function getPersonalMeasurements(dateFrom, dateTo, doUpdate) {
    $('#measurements').mask("Loading...", 100);
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
        plot1.setData([d1]);
        plot2.setData([d2]);
        plot3.setData([d3]);

        plot1.setupGrid();
        plot2.setupGrid();
        plot3.setupGrid();
        plot1.draw();
        plot2.draw();
        plot3.draw();


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
        $('#measurements').unmask();
    });
}

//get food consumption for on day and fill the list and the consumption table.
function getFood(date) {
    /*Clean up the fields*/
    $('#listDay').empty();
    $('#foodDayId').val("");
    /*NOTE, the id is not the ID, but translated to foodDate in the endpoint.
     * Thisd is done due to problems of updating the google API
     * TODO make this the right way, id should be foodDate as in the database*/
    var req = gapi.client.trvagten.getFood({'id':date, 'userId':userId});
    $('#consumedToday').mask("Loading...", 500);
    try {
        req.execute(function (data) {
            $('#consumedToday').unmask();
            if (data.consumed) {
                $('#foodDayId').val(data.id);
                var cons = JSON.parse(data.consumed.value);
                if (cons) {
                    for (i = 0; i < cons.length; i++) {
                        getNutrients(cons[i].foodId, cons[i].foodWeight, cons[i].foodDate);

                        $('#listDay').append($("<li id=remove_" + cons[i].foodId + " ></li>")
                            .html("<input readonly type='text' class='invisible inDayList' id="
                            + cons[i].foodId + " amount=" + cons[i].foodWeight + " value='"
                            + cons[i].foodName + "' ondblclick=addFunction(this); onkeydown='eventFunction(event)' onfocus='captureLastFocusedInput(this)';   ></input>"));
                    }
                }
            }

        });
    } catch (err) {
        $('#consumedToday').unmask();
        console.error(err.toString());
    }
}

/*for download*/
function getTraining(dateFrom, dateTo) {
    var req = gapi.client.trvagten.listTraening({'userId':userId, 'dateFrom':dateFrom, 'dateTo':dateTo });
    req.execute(test = function (data) {
        alert(data.items.length);
    });
}

function fillTraining(data) {
    /*empty first*/
    emptyTraining();
    /*Fill in the collected values*/
    if (data) {
        $('#traeningId').val(data.id);
        $('#datepicker2').val(toNormalDate(data.doneDate));
        $('#traeningType').prop("selectedIndex", parseInt(data.trainingType));
        $('#total').val(data.totalTimeMin);
        $('#max').val(data.maxTime);
        $('#at').val(data.atTime);
        $('#subAt').val(data.subAtTime);
        $('#ig').val(data.subAtTime);
        $('#power').val(data.power);
        $('#ig').val(data.ig);
        $('#fs').val(data.fs);
        $('#dist').val(data.distance);
        $('#UsedEnergy').val(data.energy);
        $('#place').val(data.place);
        $('#comments').val(data.comments);
        $('#percievedIntensity').val(data.percievedIntensity);
    }
}

function emptyTraining() {
    $('#traeningId').val("");
    $('#traeningType').prop("selectedIndex", 0);
    $('#total').val(0);
    $('#max').val(0);
    $('#at').val(0);
    $('#subAt').val(0);
    $('#ig').val(0);
    $('#power').val(0);
    $('#ig').val(0);
    $('#fs').val(0);
    $('#dist').val(0);
    $('#UsedEnergy').val(0);
    $('#place').val("");
    $('#comments').val("");
    $('#percievedIntensity').val(0);
}


/************************************************************************************************************************/
/*Utility functions*/
/************************************************************************************************************************/

//Convert a YYYYMMDD date to a DD/MM/YYYY date
function toNormalDate(storeDate) {
    return storeDate.toString().substr(6, 2) + "/" + storeDate.toString().substr(4, 2) + "/" + storeDate.toString().substr(0, 4)
}

//utility function to pad a number with leading zero's
var lpad = function (value, padding) {
    var zeroes = "0";
    for (var i = 0; i < padding; i++) {
        zeroes += "0";
    }
    return (zeroes + value).slice(padding * -1);
}

/*input validation made simple*/
/*TODO make it more generic with the lengt and min and max of the numbers.*/
var validateInput;
validateInput = function (className) {
    var isNok = false;
    $("." + className).each(function (index) {
        $(this).removeClass("inputError"); //reset the class to normal
        if (this.hasAttribute("digits")) { //must be a number
            if (isNaN($(this).val())) {
                $(this).addClass("inputError");
                isNok = true;
            } else { //is a number OK, but is it too big
                if (parseFloat($(this).val()) > 100000) {
                    $(this).addClass("inputError");
                    isNok = true;
                }
            }

        } else {  //is not a number, must be text
            if ($(this).val().length > 50) {
                isNok = true;
                $(this).addClass("inputError");
            }
        }
    });

    return !isNok;
};