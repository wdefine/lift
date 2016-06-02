var socket = io.connect();
var userData = [];
var UserEmail;
var WorkoutName;
$( document ).ready(function() {
		
	var gt = {reps:6, weight:100};
	var t = {reps:6, weight:150};
	var c = {reps:8, weight:135};
	var g = {reps:5, weight:"none"};
	var p = {reps:12, weight:30};
	var d = [c,c,c,c];
	var dp = [t,t,t];
	var dv = [gt,gt,gt];
	var z = [g,g,g];
	var w = [p,p,p];
	var a = {completed:true,_name:"Bench Press",rounds:d};
	var at = {completed:true,_name:"Hang Clean",rounds:dv};
	var ar = {completed:true,_name:"Box Jumps",rounds:dp};
	var r = {completed:false,_name:"Push Ups",rounds:z};
	var q = {completed:true,_name:"Tricep Extensions",rounds:w};
	var e = {completed:true, exercises:[a,r,q]};//first round of excercises
	var t = {completed:true, exercises:[a,r]};
	var tc = {completed:true, exercises:[at,ar,q]};
	var tv = {completed:true, exercises:[z,q,at]};
	var f = [e,d,t];//array

	////////Load NextWorkout//////////
 	addWorkout(f);
 	
 	//////Hamburger menu//////
 	$(document).on("tap", "#Hamburger_icon", function(){
 		console.log("hamburger");

		setTimeout(function(){$("body").append("<div id='Transparent_Div'></div>")}, 500);
		$("#nav_bar").show();
 	});
 	$(document).on("tap", "#Transparent_Div", function(){
 		console.log("transparent div");
		$("#Transparent_Div").remove();
		$("#nav_bar").hide();
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
 	//////////cycleing tables//////////
	$(document).on("swipeleft", "table", function(){
		cycle_Tables($(this).attr('id'));
	});
	$(document).on("swiperight", "table", function(){
		rev_cycle_Tables($(this).attr('id'));
	});

	$(function () {
    	var mySwiper = $('.swiper-container').swiper({
    		mode: 'horizontal',
            watchActiveIndex: true,
            spaceBetween: 100,
	   		onSlideChangeStart: function (swiper) {
                    console.log('slide change start - before');
                    console.log(swiper);
                    console.log(swiper.activeIndex);
                    //before Event use it for your purpose
            },
            onSlideChangeEnd: function (swiper) {
                    console.log('slide change end - after');
                    console.log(swiper);
                    console.log(swiper.activeIndex);
                    //after Event use it for your purpose
                    if (swiper.activeIndex == 1) {
                        //First Slide is active
                        console.log('First slide active');
                    }
                }
            });
    });
});



window.addEventListener('load', function(){
	///////Intial hides////////
	$("#nav_bar").hide();
	///////get user data///////
	socket.emit('getUserData',UserEmail);
	socket.on('userData',function(data){
		var userData = data;
		console.log(userData);
	});	
	UserEmail = $("#UserEmail").text();;
	console.log("user email: "+UserEmail);
	WorkoutName = $("#Workoutname").text();
	console.log("workout name: " + WorkoutName);

	//load in next workout//
	/*
	socket.emit("getNextWorkout", WorkoutName, UserEmail);
		socket.on("nextWorkout", function(array){
		addWorkout(array);
	});
	*/
	//load in next workout//
    $("table").on("blur", "input", function(){
        var Cell_Id = $(this).attr('id');
        var Cell_Value = $(this).val();
        var completed = false;//unless we add editing old workouts
        var Workoutname = $("#Workoutname").text();//mustached in on load
        var email = $("#UserEmail").text();//mustached in on load
        console.log("cell value :" + Cell_Value + " Cell Id: "+ Cell_Id+ " completed: "+completed+" Workout name: "+Workoutname +" email: "+email);
        socket.emit("changeWorkout", email, Workoutname, Cell_Id, Cell_Value, completed);
    });
    $(document).on("tap","#submitWorkout", function(){
    	var d = new Date();
    	var date = d.getTime();
    	socket.emit("submitWorkout", UserEmail, Workoutname, date);
    });
});
/*
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
	if(previousElementIndex >= 0){
		var previousElementId = elementIds[previousElementIndex];
		$(shownElementId).hide();
		show_only("table", previousElementId);
	}
	else{
		show_only("table", elementIds[elementIds.length - 1]);
	}
}
*/
////////ADDING TABLE FUNCTION///////////

function addWorkout(array){
	console.log(array);
	var letters = ["a","b","c","d","e","f","g"];
	var i;
	console.log(array.length);
 	for(i=0;i<array.length;i++){//for each set of excercises
		$('.swiper-wrapper').append("<div id='Slide_"+i+"' class='swiper-slide'></div>")
		$('#Slide_'+i).append("<table id=\""+i+"\" completed=\""+array[i].completed+"\"></table>");//make table
		$('#'+i).append("<tr><th colspan ='4'>Set "+(i +1)+"");//add table header	
		$('#'+i).append("<tr><th>Exercise Number<th>Exercise Name<th>Reps<th>Weight");//column header
		for(var j=0;j<array[i].exercises.length;j++){//for each excercise in the set
			var cellnum = 0;		
			$('#'+i).append("<tr id=\""+i+"_"+j+"\" name=\""+array[i].exercises[j]._name+"\" completed=\""+array[i].exercises[j].completed+"\">"+array[i].exercises[j]._name+"</tr>");// add new table row for excercise
			$('#'+i+'_'+j).append("<td id=\""+i+"_"+j+"_"+(cellnum+1)+"-ExNum\">"+(i+1)+letters[j]+"</td>");// add td with excercise number
			$('#'+i+'_'+j).append("<td id=\""+i+"_"+j+"_"+(cellnum+2)+"-ExName\">"+array[i].exercises[j]._name+"</td>");// add td  with excercise name
			$('#'+i+'_'+j).append("<td id=\""+i+"_"+j+"_"+(cellnum+3)+"_reps\"><input id='"+i+"_"+j+"_"+(cellnum+3)+"_Input' type='text' value='"+ array[i].exercises[j].rounds[j].reps+"'</td>");// add td with reps input
			$('#'+i+'_'+j).append("<td id=\""+i+"_"+j+"_"+(cellnum+4)+"_weight\"><input id='"+i+"_"+j+"_"+(cellnum+4)+"_Input' type='text' value='"+ array[i].exercises[j].rounds[j].weight+"'</td>");// add td with weight input
		}
	}
	console.log(i);
	$('#Slide_'+i).append("<button id='submitWorkout'>Sumbit Workout</button>");
	i==0;
}
