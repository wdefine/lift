 //var socket = io.connect();
$( document ).ready(function() {
	console.log("ready");
	$(document).on("tap", "table", function(){
		cycle_Tables($(this).attr('id'));

	});
	//testing
	var c = {reps:8, weight:135};
	var g = {reps:5, weight:"none"};
	var p = {reps:12, weight:30};
	var d = [c,c,c,c];	
	var a = {completed:true,_name:"Bench Press",rounds:d};
	var z = [g,g,g];
	var w = [p,p,p];
	var r = {completed:false,_name:"Push Ups",rounds:z};
	var q = {completed:true,_name:"Tricep Extensions",rounds:w};
	var e = {completed:true, exercises:[a,r,q]};//first round of excercises
	var t = {completed:true, exercises:[a,r]};
	var f = [e,e,t];//array

 	var array = f
 	addWorkout(f);
});



window.addEventListener('load', function(){
	//show_only("table","1");
	
	//addWorkout("_3-2-4", 3, true);
	//////////////////////
	////initial hides/////
	//////////////////////
	$('#Date_3-2-16').accordion({
		active:0
	});
	$( ".tabs" ).tabs({
  		active: 0
	});
	$("h1").bind("tap",function(){
		console.log("Date Bar tap");
		$("h1").hide();
		var a = $('#Workout_bar');
		a.css("background-color", "#323333");
		$('#Workout_bar li').css("background-color", "#323333");
	
		$(this).css("background-color", '#737373' )

	});
	//$(document).on("click", "table", function(){
	//	cycle_Tables($(this).attr('id'));

	//});
	////PAGE SET UP////

	//socket.emit('getNextWorkout')


///////TO BE FINISHED
	var First_Cell_Clicked = false;
	var Last_Cell;
    $("table").on("focus", "input", function(){
    	console.log("works");
        if (First_Cell_Clicked == true){
            var Value_to_be_Sent = $(this).val();
            console.log(Value_to_be_Sent);
        } 
        var Cell_Id
        Last_Cell = $(this);

        First_Cell_Clicked = true;
        //socket.emit("Entered_Data", Cell_ID_Number, Cell_Data_Type, Value_to_be_Sent, id_of_cell_to_be_sent);
    });











});
function show_only(elementType, elementToBeShown){
	var elements = document.getElementsByTagName(elementType);
	console.log(elements.length);
	for(var i = 0; i < elements.length; i++){
		console.log(elements[i].getAttribute('id')+ " = "+ elementToBeShown);
		if(elements[i].getAttribute('id') == elementToBeShown){
			console.log("show");
			$(elements[i]).show();
		}
		else{
			console.log("not show");
			$(elements[i]).hide();
		}
	}
}

function cycle_Tables(shownElementId){
	var tables = document.getElementsByTagName("table");
	var elementIds = [];
	for (var i = 0; i < tables.length; i++){
		var id = tables[i].getAttribute('id')
		elementIds.push(id);
	};
	var nextElementIndex = elementIds.indexOf(shownElementId) + 1;
	var nextElementId = elementIds[nextElementIndex];
	$(shownElementId).hide();
	show_only("table", nextElementId);
	if(nextElementIndex == elementIds.length){
		show_only("table", elementIds[0]);
	}
   
}
////////ADDING TABLE FUNCTION///////////
function addWorkout(array){
	var letters = ["a","b","c","d","e","f","g"];
 	for(var i=0;i<array.length;i++){//for each set of excercises
		var temp = i;
		$('#date').append("<table id=\""+i+"\" completed=\""+array[i].completed+"\"></table>");//make table
		$('#'+i).append("<tr><th colspan ='4'>Set "+(i +1)+"");//add table header	
		$('#'+i).append("<tr><th>Exercise Number<th>Exercise Name<th>Reps<th>Weight");//column headers
		for(var j=0;j<array[i].exercises.length;j++){//for each excercise in the set
			var cellnum = 0;		
			$('#'+i).append("<tr id=\""+i+"-"+j+"\" name=\""+array[i].exercises[j]._name+"\" completed=\""+array[i].exercises[j].completed+"\">"+array[i].exercises[j]._name+"</tr>");// add new table row for excercise
			$('#'+i+'-'+j).append("<td id=\""+i+"-"+j+"-"+(cellnum+1)+"-ExNum\">"+(i+1)+letters[j]+"</td>");// add td with excercise number
			$('#'+i+'-'+j).append("<td id=\""+i+"-"+j+"-"+(cellnum+2)+"-ExName\">"+array[i].exercises[j]._name+"</td>");// add td  with excercise name
			$('#'+i+'-'+j).append("<td id=\""+i+"-"+j+"-"+(cellnum+3)+"-reps\"><input id='"+i+"-"+j+"-"+(cellnum+3)+"_Input' type='text' value='"+ array[i].exercises[j].rounds[j].reps+"'</td>");// add td with reps input
			$('#'+i+'-'+j).append("<td id=\""+i+"-"+j+"-"+(cellnum+4)+"-weight\"><input id='"+i+"-"+j+"-"+(cellnum+4)+"_Input' type='text' value='"+ array[i].exercises[j].rounds[j].weight+"'</td>");// add td with weight input
		}
	} 		
}

function addDateToWorkoutBar(Date){

}














