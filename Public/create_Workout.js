//var socket = io.connect();
window.addEventListener('load', function(){
	$("#View_Progress_Page").hide();
	$("#Create_Workout_Page").show();

	///////////////////////////////////
	/////Page Navigation//////////////
	//////////////////////////////////

	$("#View_Progress_Nav_Button").click(function(){
		$("#View_Progress_Page").show();
		$("#Create_Workout_Page").hide();
	});
	$("#Create_Workout_Nav_Button").click(function(){
		$("#View_Progress_Page").hide();
		$("#Create_Workout_Page").show();
	});

	///////////////////////////////////
	/////////Send 

});