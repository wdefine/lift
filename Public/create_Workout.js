//NOTE: lots of things are happening on this page. It may be easier on the user
// to break this into multiple pages. There are more possible functions than the
//ones down there too. Lets get the basics down first.

var socket = io.connect();
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
function createFullWorkout(){
	//this is where you create the fullworkout which is basically just the name, number of cycles(weeks),
	//and number of days in a cycle(days a week working out). You don'y even need dates for the workouts!
	var name = //get name from text field
	var cyclenum = //get cyclenum from text field (make sure is a number)
	var cyclelen = //get cyclelen from text field (make sure is a number)
	socket.emit("createFullWorkout",name,cyclenum,cyclelen);
}
function assignWorkout(){
	//this is where you assign the full workout above to a group of users
	var full = //get full from dropdown
	var group = //get group from dropdown
	socket.emit("assignWorkout", full, group);
}
function unAssignWorkout(){
	//the opposite of above
	socket.emit("unAssignWorkout",full,group);
}
function createGroup(){
	var array = //list of users(objects with name and email fields) that are initially put in group
	socket.emit("createGroup",name,array)
}
function editGroupadd(){ //adds an additional user to a preexisting group
	var name = //name of the group
	var user = //object with email and name
	socket.emit("editGroupadd", name, user)
}
function editGroupdelete(){ //removes a user from a group
	var name = //name of the group
	var user = //object with email and name
	socket.emit("editGroupdelete", name, user)
}
function createUser(){
	//yes right now odonnell has to do this
	socket.emit("createUser",name,email);
}

//Here is where the process of actually building the workout starts. This is the tricky part.
//

function createWorkout(){
	var full = //the full workout that this workout is being built in
	var cycle = //the cycle aka the week
	var day = //the day of the week i.e. 1,2,3
	var date = //the actual day that this workout should take place in utc time---try http://api.jqueryui.com/datepicker/ for getting dates
	var array = // the tricky part
				// we will create the workout in html and then convert that html into an array to send to the server
	socket.emit("createWorkout",full,array,date,cycle,day);
}

/* Basic HTML structure -the exact details depend on making it look nice
div id=newworkout
	div class=newset 
	button delete set
		div class=newexercise 
		button delete exercise
			div class=newround
				text weight =?
				text reps =?
			button delete round
			div class=newround
				text weight =?
				text reps =?
			button delete round
			button new round
		div class=newexercise 
		button delete exercise
		button new exercise
	div class=newset
	button delete set
	button newset
*/
/* The array structure. This cannot be improved (even if it is inefficent). It must be like this for the server.
var rd = {reps:number_of_reps}
var rdlist = {rd1,rd2,......}
var ex1 = {name:name_of_exercise, rounds:rdlist}
var exlist = {ex1,ex2,......}
var set1 = {exercises:exlist}
var array = {set1,set2,....}
*/