//NOTE: lots of things are happening on this page. It may be easier on the user
// to break this into multiple pages. There are more possible functions than the
//ones down there too. Lets get the basics down first.
///populate dropdowns from server
//var socket = io.connect();
window.addEventListener('load', function(){
	$('#Create_Full_Workout_Page').hide();
	$("#Create_Group_Page").hide();
	$("#Create_Account_Page").hide();
	$("#View_Progress_Page").hide();
	$("#Assign_Workout_Page").hide();
	$("#Create_Workout_Page").show();
	///////////////////////////////////
	/////Page Navigation//////////////
	//////////////////////////////////
	//will clean up later
	$("#Create_Workout_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').hide();
		$("#Create_Group_Page").hide();
		$("#Create_Account_Page").hide();
		$("#View_Progress_Page").hide();
		$("#Assign_Workout_Page").hide();
		$("#Create_Workout_Page").show();
	});
	$("#Create_Group_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').hide();
		$("#Create_Group_Page").show();
		$("#Create_Account_Page").hide();
		$("#View_Progress_Page").hide();
		$("#Assign_Workout_Page").hide();
		$("#Create_Workout_Page").hide();
	});
		$("#View_Progress_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').hide();
		$("#Create_Group_Page").hide();
		$("#Create_Account_Page").hide();
		$("#View_Progress_Page").show();
		$("#Assign_Workout_Page").hide();
		$("#Create_Workout_Page").hide();
	});
	$("#Assign_Workout_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').hide();
		$("#Create_Group_Page").hide();
		$("#Create_Account_Page").hide();
		$("#View_Progress_Page").hide();
		$("#Assign_Workout_Page").show();
		$("#Create_Workout_Page").hide();
	});
	$("#Create_User_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').hide();
		$("#Create_Group_Page").hide();
		$("#Create_Account_Page").show();
		$("#View_Progress_Page").hide();
		$("#Assign_Workout_Page").hide();
		$("#Create_Workout_Page").hide();
	});
	$("#Create_Full_Workout_Button").click(function(){
		$('#Create_Full_Workout_Page').show();
		$("#Create_Group_Page").hide();
		$("#Create_Account_Page").hide();
		$("#View_Progress_Page").hide();
		$("#Assign_Workout_Page").hide();
		$("#Create_Workout_Page").hide();
	});

	///////////////////////////////////
	/////////Send 


	console.log($("#WorkoutName").val());
	//$("#Create_Workout_Nav_Button, #Create_sub_nav_bar").mouseenter(Sub_Bar_On).mouseleave(Sub_Bar_Off);
	$("#SubmitWorkoutButton").on("click", function(){
		if ($("#WorkoutName").val() == "" || $("#CycleNum").val() == ""){
			//pop error message
		}
		else{
			createFullWorkout()
		}
	});
	$(document).on("click", "#AssignWorkoutButton",function(){
		assignWorkout();
	});
	$(document).on("click", "#UnAssignWorkoutButton",function(){
		unAssignWorkout();
	});

	$(document).on("click", "#SubmitGroupButton",function(){
		createGroup();
	});
	//Adding members to new group
	$(document).on("click", "#AddToNewGroupButton",function(){
		console.log("NEW");
		var NewMemberName = $("#NewGroupMemberNameNew").val();
		var NewMemberEmail = $("#NewGroupMemberEmailNew").val();
		var name = $("#NewGroupName").val();
		$("#AddMemberRowNew").before("<tr class='MemberOfNewGroup'><td class='Name'>"+NewMemberName+"</td><td class='Email'>"+NewMemberEmail+"</td><td><button class='RemoveNewMemberButton'>-</button></td></tr>")
		editGroupadd(name, NewMemberName, NewMemberEmail);
	});
	//adding members to existing group
	$(document).on("click", "#AddToGroupButton",function(){
		var NewMemberName = $("#NewGroupMemberName").val();
		var NewMemberEmail = $("#NewGroupMemberEmail").val();
		var name = $("#AssignGroupDrop").val();
		$("#AddMemberRow").before("<tr class='MemberOfNewGroup'><td class='Name'>"+NewMemberName+"</td><td class='Email'>"+NewMemberEmail+"</td><td><button class='RemoveMemberButton'>-</button></td></tr>")
		editGroupadd(name, NewMemberName, NewMemberEmail);
	});
	//Deleting members from new group
	$(document).on("click", ".RemoveNewMemberButton",function(){
		var NewMemberName = $("#NewGroupMemberName").val();
		var NewMemberEmail = $("#NewGroupMemberEmail").val();
		var name = $("#NewGroupName").val();
		editGroupdelete(name, NewMemberName, NewMemberEmail);
		$('tr').has($(this)).remove();
		
	});
	//deleting members from existing group
	$(document).on("click", ".RemoveMemberButton", function(){
		var NewMemberName = $("#NewGroupMemberName").val();
		var NewMemberEmail = $("#NewGroupMemberEmail").val();
		var name = $("#AssignGroupDrop").val();
		editGroupdelete(name, NewMemberName, NewMemberEmail);
		$('tr').has($(this)).remove();
		
	});
	$(document).on("click", "#CreateNewUserButton", function(){
		createUser();
	});
});
/*function Sub_Bar_On(){
	$("#Create_sub_nav_bar").show();
}
function Sub_Bar_Off(){
	$("#Create_sub_nav_bar").hide();
}*/
//done
function createFullWorkout(){
	//this is where you create the fullworkout which is basically just the name, number of cycles(weeks),
	//and number of days in a cycle(days a week working out). You don'y even need dates for the workouts!
	var name = $("#WorkoutName").val();//get name from text field
	var cyclenum = $("#CycleNum").val();//get cyclenum from text field (make sure is a number)
	var cyclelen = $("#CycleLenDrop").val();//get cyclelen from text field (make sure is a number)
	socket.emit("createFullWorkout",name,cyclenum,cyclelen);
}
//done
function assignWorkout(){
	//this is where you assign the full workout above to a group of users
	var full = $("#AssignWorkoutDrop").val();//get full from dropdown
	var group = $("#AssignGroupDrop").val();//get group from dropdown
	console.log(full + " "+ group);
	socket.emit("assignWorkout", full, group);
}
//done
function unAssignWorkout(){
	var full = $("#UnAssignWorkoutDrop").val();//get full from dropdown
	var group = $("#UnAssignGroupDrop").val();//get group from dropdown
	console.log(full + " "+ group);
	socket.emit("unAssignWorkout",full,group);
}
//done
function createGroup(){
	var name = $("#NewGroupName").val();
	var memberElements = $(".MemberOfNewGroup");
	var array = [];
	memberElements.each(function(){
		var name = $(this).find(".Name").text();
		var email = $(this).find(".Email").text();
		var user = {name:name, email:email};
		array.push(user);
	});
	//list of users(objects with name and email fields) that are initially put in group
	socket.emit("createGroup",name,array);
}
//done
function editGroupadd(WorkoutName, MemberName, NewMemberEmail){ //adds an additional user to a preexisting group
	var user = {name:MemberName, email:NewMemberEmail};
	socket.emit("editGroupadd", WorkoutName, user);
	$("#NewGroupMemberName").val("");
	$("#NewGroupMemberEmail").val("");
}
//done
function editGroupdelete(WorkoutName, MemberName, NewMemberEmail){ //removes a user from a group
	var name = WorkoutName;//name of the group
	var user = {name:MemberName, email:NewMemberEmail};//object with email and name
	socket.emit("editGroupdelete", name, user)

}
//done
function createUser(){
	//yes right now odonnell has to do this
	var name = $("#NewUserFirstName").val() + " " + $("#NewUserLastName").val();
	var email = $("#NewUserEmail").val();
	console.log(name + " "+ email);
	socket.emit("createUser",name,email);
	$("#NewUserFirstName").val("");
	$("#NewUserLastName").val("");
	$("#NewUserEmail").val("");
}

//Here is where the process of actually building the workout starts. This is the tricky part.
//

function createWorkout(){
	var full = null;//the full workout that this workout is being built in
	var cycle = null;//the cycle aka the week
	var day = null;//the day of the week i.e. 1,2,3
	var date = null//the actual day that this workout should take place in utc time---try http://api.jqueryui.com/datepicker/ for getting dates
	var array = null// the tricky part
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