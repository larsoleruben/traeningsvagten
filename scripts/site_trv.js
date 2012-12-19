/**
 * Created with JetBrains WebStorm.
 * User: lars
 * Date: 12/14/12
 * Time: 7:19 PM
 * To change this template use File | Settings | File Templates.
 */

$(document).ready(function () {
    //add the datepicker to the consumed day
    $(function () {
        $("#dialog-form").dialog({
            autoOpen:false,
            height:250,
            width:250,
            modal:true,
            buttons:{
                "Tilføj:":function () {

                    $('#totalConsumed')
                        .append($("<option></option>")
                        .attr("value", $("#result option:selected").val())
                        .text($("#result option:selected").text()));
                    $(this).dialog("close");

                },
                Cancel:function () {
                    $(this).dialog("close");
                }
            }
        });
        $("#addSelected").button()
            .click(function () {
                //change the text in the popup dialog
                $('p#popTextAdd').html( "Skriv hvor mange gram af:<br>" + $("#result option:selected").text() );
                //open the dialog
                $("#dialog-form").dialog("open");
            });
    });

    var dag = new Date();
    $('#datepicker').val(dag.getDate() + '/' + dag.getMonth() + '/' + dag.getFullYear());
    $("#datepicker").datepicker();

    //get the food search
    $('#search').change(function () {
        queryFood($('#search').val());
    });

    $('#searchBtn').button().click(function () {
        queryFood($('#search').val());
    });

    $('#saveDayButton').button();

    $("#result").dblclick(function () {
        //change the text in the popup dialog
        $('p#popTextAdd').html( "Skriv hvor mange gram af:<br>" + $("#result option:selected").text() );
        //open the dialog
        $("#dialog-form").dialog("open");
    });


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
});


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
}





