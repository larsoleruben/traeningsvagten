/**
 * Created with JetBrains WebStorm.
 * User: lars
 * Date: 12/14/12
 * Time: 7:19 PM
 * To change this template use File | Settings | File Templates.
 */

/*some global vars to hold object of the day*/
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


$(document).ready(function () {


    /* Start Global Declarations */

    var dag = new Date();
    var consumed = [];  //array to hold daily consumption of food

    /*End Global Declarations*/

    $('#search').focus();

    $("#dialog-form").dialog({
        autoOpen:false,
        height:300,
        width:250,
        modal:true,
        buttons:{
            "Tilføj:":function () {
                /*TODO
                 * Must add already present foodid's to the foodid which is alredy in the list. This is important, otherwise
                 * removal leads to negative numbers and user might not get the result whished for.
                 * */

                 if (checkInput($('#amount').val(), "num")) {
                    var objDC = new objDailyConsumed($("#result option:selected").val(), $("#result option:selected").text(), $('#amount').val());
                    $('#totalConsumed')
                        .append($("<option></option>")
                        .attr("value", $("#result option:selected").val())
                        .text(lpad(objDC.food_amount, 3) + " gram af: " + $("#result option:selected").text()));

                    consumed.push(objDC);
                    //$("#consumedTable > tbody").append("<tr><td>"+ objDC.food_id  + "</td><td>" + objDC.food_name +"</td><td>"+ objDC.food_amount + "</td></tr>" );
                    //updateConsumedTbl();

                    var dateString = $('#datepicker').val().split("/");
                    getNutrients(objDC.food_id, objDC.food_amount, dateString[2] + dateString[1] + dateString[0]);
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
            openDialogCust();
        });


    /*End modal popup form*/


    $('#datepicker').val(dag.getDate() + '/' + dag.getMonth() + '/' + dag.getFullYear());
    $("#datepicker").datepicker();

    //get the food search
    $('#search').change(function () {
        queryFood($('#search').val());
    });
    //Add the food by hitting enter.


    $('#amount').keypress(function(e){

        if (e.keyCode == $.ui.keyCode.ENTER && checkInput($('#amount').val(), "num" ) ) {
            var objDC = new objDailyConsumed($("#result option:selected").val(), $("#result option:selected").text(), $('#amount').val());
            $('#totalConsumed')
                .append($("<option></option>")
                .attr("value", $("#result option:selected").val())
                .text(lpad(objDC.food_amount, 3) + " gram af: " + $("#result option:selected").text()));

            consumed.push(objDC);
            //$("#consumedTable > tbody").append("<tr><td>"+ objDC.food_id  + "</td><td>" + objDC.food_name +"</td><td>"+ objDC.food_amount + "</td></tr>" );
            //updateConsumedTbl();

            var dateString = $('#datepicker').val().split("/");

            getNutrients(objDC.food_id, objDC.food_amount, dateString[2] + dateString[1] + dateString[0]);
            $('#dialog-form').dialog("close");
            $('#search').focus();
        }

    });

    $('#searchBtn').button().click(function () {
        queryFood($('#search').val());
        $('#result').focus();
    });

    $('#saveDayButton').button();

    $("#result").dblclick(function () {
        openDialogCust();
        /*
        //change the text in the popup dialog
        $('p#popTextAdd').html("Skriv hvor mange gram af:<br>" + $("#result option:selected").text());
        //open the dialog
        $('#amount').val("");
        $("#dialog-form").dialog("open");
        */
    });

    $("#result").keypress(function(e){

        if(e.keyCode == $.ui.keyCode.ENTER ){
            openDialogCust();
            /*
            //change the text in the popup dialog
            $('p#popTextAdd').html("Skriv hvor mange gram af:<br>" + $("#result option:selected").text());
            //open the dialog
            $('#amount').val("");
            $("#dialog-form").dialog("open");
            */
        }
    });


    //Remove the selected objects by doublecliking
    $('#totalConsumed').dblclick(function () {
        var tobeRemoved = [];
        var foodId = $("#totalConsumed option:selected").val();
        var dateString = $('#datepicker').val().split("/");
        //loop all the objects from this day and subtract the selected
        for (i = 0; i < consumed.length; i++) {
            switch (consumed[i].food_id) {
                //remove them from the totals
                case foodId:
                    getNutrients(foodId, "-" + consumed[i].food_amount, dateString[2] + dateString[1] + dateString[0])
                    //remove it from the listbox
                    $("#totalConsumed option[value='" + foodId + "']").remove();
                    //add it to the array
                    tobeRemoved.push(i);
            }
        }
        /*remove the indexes marked for removal*/
        for (i = 0; i < tobeRemoved.length; i++) {

            consumed.splice(tobeRemoved[i], 1);
        }
    });

    /*Start JSONP to get food values from the other site*/
    function queryFood(searchString) {
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

    /* object to contain all the stuff from one days consumption. */
    function objDailyConsumed(food_id, food_name, food_amount) {
        this.food_id = food_id;
        this.food_name = food_name;
        this.food_amount = food_amount;
    }

    function openDialogCust(){
        //change the text in the popup dialog
        $('p#popTextAdd').html("Skriv hvor mange gram af:<br>" + $("#result option:selected").text());
        //open the dialog
        $('#amount').val("");
        $("#dialog-form").dialog("open");
    }
});

/*End the on ducument load stuff Starting of stand alone functions, which the need to be due to JSONP*/

function checkInput(input, type) {
    var retVal = false;
    if (type === "num") {
        if (/^\d+$/.test(input)) {
            if( parseFloat(input) < 1000) {
                retVal = true;
            }else{
                retVal = false;
            }
        } else {
            retVal = false;
        }
    }
    if( !retVal ){
        $('.validateTips').html("Input skal være et tal eller mindre en 1000!");
    }else{
        $('.validateTips').html("");
    }
    return retVal;
}


/*is automatically called by the return values from queryFood   */
function updateFood(foodValues) {
    //clear up
    $('#result')
        .find('option')
        .remove()
        .end();
    //add the new query result
    for (var i = 0; i < foodValues.length; i++) {
        var singleObject = foodValues[i];
        $('#result')
            .append($("<option></option>")
            .attr("value", singleObject.FoodId)
            .text(singleObject.DanName));
    }
    $('#result:first').focus();
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
