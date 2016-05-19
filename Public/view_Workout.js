 //var socket = io.connect();
 window.addEventListener('load', function(){

 	var array = [3,2,1];
 	for(var i=1;i<=array.length;i++){
 			$('#Workouts').append("<div id=\""+i+"\" completed=\""+array[i][i]+"\">Set #"+i+"</div>"); 			for(var j=1;j<=array[i][exercises].length;j++){ 				$('#'+i).append("<div id=\""+i+"-"+j+"\" name=\""+array[i][exercises][name]+"\" completed=\""+array[i][exercises][j]+"\">"+array[i][exercises][name]+"</div>");
				for(var k=1;k<=array[i][exercises][rounds].length;k++){
					$('#'+i+'-'+j).append("<div id=\""+i+"-"+j+"-"+k+"\">Round#"+k+"</div>");
					$('#'+i+'-'+j+'-'+k).append("<text id=\""+i+"-"+j+"-"+k+"-reps\">"+ array[i][exercises][j][rounds][k][reps]+"</text");
					$('#'+i+'-'+j+'-'+k).append("<text id=\""+i+"-"+j+"-"+k+"-weight\">"+array[i][exercises][j][rounds][k][weight]+"</text");
				}
			}
		}


	addWorkout("_3-2-4", 3, true);
	//////////////////////
	////initial hides/////
	//////////////////////
	$('#Date_3-2-16').accordion({
		active:0
	});
	$( ".tabs" ).tabs({
  		active: 0
	});
	show_only("Table", "Excersie_1_Set_1")

	$('table').on("swipe",function(){
		console.log("Table Tapped");
		var table_id = $(this).attr("id");	
		console.log(table_id);
		cycle_Tables("table", table_id);
	});

	$("#Workout_bar li").on("tap",function(){
		console.log("Date Bar tap");
		var a = $('#Workout_bar');
		a.css("background-color", "#323333");
		$('#Workout_bar li').css("background-color", "#323333");
	
		$(this).css("background-color", '#737373' )

	});
	///testing///
	/*$('table').on("click",function(){
		var table_id = $(this).attr('id');
		addWorkoutTableLine(table_id, 2, "4a", "Box Jumps", 3, 10, 0, 25, false);
		addWorkoutTableLine(table_id, 2, "4b", "Lunges", 12, 1, 40, 0, true);
	});
	$('table').on("click", function(){
		$('#Date_3-2-16').hide();
	});

	*/
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
            //socket.emit("Entered_Data", Cell_ID_Number, Cell_Data_Type, Value_to_be_Sent, id_of_cell_to_be_sent);
        }
        First_Cell_Clicked = true;
    });











});

function sendWorkoutData(){
	socket.emit
}
function show_only(elementType, elementToBeShown){
	var elements = document.getElementsByTagName(elementType);
	for(var i = 0; i < elements.length; i++){
		if(elements[i].getAttribute('id') == elementToBeShown){
			$(elements[i]).show();
		}
		else{
			$(elements[i]).hide();
		}
	}
}

function cycle_Tables(elementType, shownElementId){
	var elements = document.getElementsByTagName(elementType);
	var elementIds = [];
	for (var i = 0; i < elements.length; i++){
		var id = elements[i].getAttribute('id')
		elementIds.push(id);
	};
	var nextElementIndex = elementIds.indexOf(shownElementId) + 1;
	var nextElementId = elementIds[nextElementIndex];

	$("#"+shownElementId).hide();
	$("#"+nextElementId).show();
	console.log(elementIds.length);
	console.log(nextElementIndex);
	if(nextElementIndex == elementIds.length){
		$("#"+elementIds[0]).show();
		console.log("last table");
	}
   
}
////////ADDING TABLE FUNCTION///////////
function addWorkout(WorkoutDate, ListOfExcercises, IsFirstExcercise){
	var first = IsFirstExcercise;
	$("#Workouts").append('<div id ="'+WorkoutDate+'">');//3/12/20
	$("#"+WorkoutDate).append('<div id = "'+WorkoutDate+'_CollapsedSet" data-role="collapsible-set">');//workout excercis accordion

	for(i = 0; i < ListOfExcercises; i++){//for each group of excercises
		var num = i +1;
		if(first == true){
			$("#"+WorkoutDate+"_CollapsedSet").append('<div id = "'+WorkoutDate+'_GroupOfExcercises_'+num+'" data-role="collapsible" data-collapsed="false">');//each section of that accordion, expanded
			first = false;
		}
		else if(first == false){
			$("#"+WorkoutDate+"_CollapsedSet").append('<div id = "'+WorkoutDate+'_GroupOfExcercises_'+num+'" data-role="collapsible"');//each section of that accordion, not expanded
		}
		$("#"+WorkoutDate+'_GroupOfExcercises_'+num).append("<h3>"+num);//header for each group of excercises
		$("#"+WorkoutDate+'_GroupOfExcercises_'+num).append('<div id = "'+WorkoutDate+'_GroupOfExcercises_'+num+'_Contents" role="main" class="ui-content">');
		$("#"+WorkoutDate+'_GroupOfExcercises_'+num+'_Contents').append('<div id="'+WorkoutDate+'_GroupOfExcercises_'+num+'_Contents_TabsWrapper'+'data-role="tabs">');
		$("#"+WorkoutDate+'_GroupOfExcercises_'+num+'_Contents_TabsWrapper').append('<ul id="'+WorkoutDate+'_GroupOfExcercises_'+num+'_Tabs>');
	}
	
	//$('#Excercise_'+ ExcerciseSetNumber + "_Set_" + SetNumber).zIndex(zIndexCounter);
}

//Table:Table element, ExcerciseNumber: 1a,2a...,
function addWorkoutTableLine(TableId, TableNumber, ExcerciseNumber, ExerciseName, ExerciseSetNumber, ExerciseRepNumber, ExerciseWeightKG, ExerciseWeightLBS, NeedsSubmitButton){
	

	$("#"+TableId).append('<tr id="'+ ExcerciseNumber +'">');
	$("#"+ExcerciseNumber).append('<td>'+ExcerciseNumber+"</td>");
	$("#"+ExcerciseNumber).append('<td>'+ExerciseName+"</td>");
	$("#"+ExcerciseNumber).append('<td><form><input type="text" id="'+ TableNumber + "_" + ExcerciseNumber + '_Sets"' + 'value="' + ExerciseSetNumber + '" ></td>');
	$("#"+ExcerciseNumber).append('<td><form><input type="text" id="'+ TableNumber + "_" + ExcerciseNumber + '_Reps"' + 'value="' + ExerciseRepNumber + '" ></td>');
	$("#"+ExcerciseNumber).append('<td><form><input type="text" id="'+ TableNumber + "_" + ExcerciseNumber + '_KGs"' + 'value="' + ExerciseWeightKG + '" ></td>');
	$("#"+ExcerciseNumber).append('<td><form><input type="text" id="'+ TableNumber + "_" + ExcerciseNumber + '_LBs"' + 'value="' + ExerciseWeightLBS + '" ></td>');

	if(NeedsSubmitButton == true){
		$("#"+TableId).append('<tr colspan="6"><button  type="button" id="Workout_Submit_Button">Submit Workout</button></tr>');
	}

}

function addDateToWorkoutBar(Date){

}














