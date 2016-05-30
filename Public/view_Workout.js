var socket = io.connect();
var userData = [];
$( document ).ready(function() {
	socket.emit('getUserData',$('#UserEmail').val())
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
	var f = [e,e,t,e,t,t];//array

 	var array = f
 	addWorkout(f);

	$(document).on("swipeleft", "table", function(){
		cycle_Tables($(this).attr('id'));
	});
	$(document).on("swiperight", "table", function(){
		rev_cycle_Tables($(this).attr('id'));
	});
	$(document).on("tap", "#NavWorkout", function(){
		$("#WorkoutPage").show();
		$("#ProgressPage").hide();
		$("#ProfilePage").hide();
		$("#nav_bar li").css("background-color", '#7b3040' );
		$(this).css("background-color", '#737373' );

	});
	$(document).on("tap", "#NavProfile", function(){
		$("#WorkoutPage").hide();
		$("#ProgressPage").hide();
		$("#ProfilePage").show();
		$("#nav_bar li").css("background-color", '#7b3040' );
		$(this).css("background-color", '#737373' );

	});
	$(document).on("tap", "#NavProgress", function(){
		$("#WorkoutPage").hide();
		$("#ProgressPage").show();
		$("#ProfilePage").hide();
		$("#nav_bar li").css("background-color", '#7b3040' );
		$(this).css("background-color", '#737373' );

	});


	show_only("table","0");//hides all tables except first

	socket.on('userData',function(data){
		userData = data;
		//do stuff with data here (for Scott's stuff)
	})
});
window.addEventListener('load', function(){
	
	//addWorkout("_3-2-4", 3, true);
	//////////////////////
	////initial hides/////
	//////////////////////
	
	//$(document).on("click", "table", function(){
	//	cycle_Tables($(this).attr('id'));

	//});
	////PAGE SET UP////

	//socket.emit('getNextWorkout')


///////TO BE FINISHED
	//$(document).on(tap)
    $("table").on("blur", "input", function(){
    	console.log("works");
        var Cell_Id = $(this).attr('id');
        var Cell_Value = $(this).val();
        var completed = false;//unless we add editing old workouts
        var Workoutname = $("#Workoutname").text();//mustached in on load
        var email = $("#UserEmail").text();//mustached in on load
        console.log("cell value :" + Cell_Value + "Cell Id: "+ Cell_Id+ "completed: "+completed+"Workout name: "+Workoutname +"email: "+email);
        socket.emit("changeWorkout", Last_Cell_Id, Last_Cell_Value, completed, workoutname, email);
    });











});
function show_only(elementType, elementToBeShown){
	var elements = document.getElementsByTagName(elementType);
	for(var i = 0; i < elements.length; i++){
		console.log(elements[i].getAttribute('id')+ " = "+ elementToBeShown);
		if(elements[i].getAttribute('id') == elementToBeShown){
			$(elements[i]).show();
		}
		else{
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
function rev_cycle_Tables(shownElementId){
	var tables = document.getElementsByTagName("table");
	var elementIds = [];
	for (var i = 0; i < tables.length; i++){
		var id = tables[i].getAttribute('id')
		elementIds.push(id);
	}
	var previousElementIndex = elementIds.indexOf(shownElementId) -1;
	console.log(previousElementIndex);
	if(previousElementIndex >= 0){
		var previousElementId = elementIds[previousElementIndex];
		$(shownElementId).hide();
		show_only("table", previousElementId);
	}
	else{
		show_only("table", elementIds[elementIds.length - 1]);
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

