//NOTE: lots of things are happening on this page. It may be easier on the user
// to break this into multiple pages. There are more possible functions than the
//ones down there too. Lets get the basics down first.
///populate dropdowns from server
//var socket = io.connect();

var unfinished = [];
var finished = [];

window.addEventListener('load', function(){ //  --- }); ---where should this final line of code go?????
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


	socket.on("fullWorkout",function(list){
		sortFull(list);
	});
	socket.on("blankWorkout",function(array){
		fillWorkout(array);
	});
	///////////////////////////////////
	/////////Send 

	/*
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
	*/
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
	$(document).on("click", '#submit-ex-button', function(){
		sumbitEx();
	});
	$(document).on("change", "#full_workout", function(){
		getFull();
	});
	$(document).on("change", "#week/day", function(){
		getWeekDay();
	});
/*function Sub_Bar_On(){
	$("#Create_sub_nav_bar").show();
}
function Sub_Bar_Off(){
	$("#Create_sub_nav_bar").hide();
}*/
//done
function getFull(){
	var full = $("#full_workout").val();
	if(full == ""){
		$("#week/day").empty();
		$("#week/day").append("<option value=\"\">Week x, Day y</option>");
		finished = [];
		unfinished = [];
	}
	else{
		$("#week/day").empty();
		$("#week/day").append("<option value=\"\">Week x, Day y</option>");
		finished = [];
		unfinished = [];
		socket.emit("getFullWorkout", full);
	}
}
function sortFull(list){
	for(var i=0;i<list.length;i++){
		if(list[i].skip == true){
			finished.push(list[i]);
			$("#week/day").append("<option value=\""+list[i].cycle+"/"+list[i].day+"\">Week "+list[i].cycle+", Day "+list[i].day+"</option>");
		}
		else{
			unfinished.push(list[i]);
		}
	}
};
function getWeekDay(){  //this is why we have fulls, if user has already created week 1 day 1 workout, 
						//then week 2 day 1 workout will be filled in for the user
	var val = $("#week/day").val();
	if(val != ""){
		var week = val.substring(0,val.indexOf("/"));
		var day = val.substring(val.indexOf("/")+1);
		for(var i=unfinished.length-1;i>=0;i--){
			if(unfinished[i].day == day){
				socket.emit("getBlankWorkout", unfinished[i].workout);
				break;
			}
		}
	}
}
function fillWorkout(array){
	var rowlen = $("#Exercise_Forms").rows.length;
	for(var i=2;i<rowlen;i++){
		$("#Exercise_Forms").deleteRow(i);
	}
	for(var i=0;i<array.length;i++){
		for(var j=0;j<array[i].exercises.length;j++){
			var ex = array[i].exercises[j];
			var set = i+1;
			var exnum = j+1;
			var exnam = ex.name;
			var sets = ex.rounds.length;
			var reps = ex.rounds[0].reps;
			$("#Exercise_Forms").append("
			<td class=\"set-number\" contentEditable=\"true\">"+set+"</td>
			<td class=\"exercise-number\" contentEditable=\"true\">"+exnum+"</td>
			<td class=\"exercise-name\">"+exnam+"</td>
			<td class=\"exercise-sets\" contentEditable=\"true\">"+sets+"</td>
			<td class=\"exercise-reps\" contentEditable=\"true\">"+reps+"</td>
			<td class=\"delete-ex-button\" onclick=function(){this.parent().remove();}>Delete</td>
			");
		}
	}
}
function submitEx(){
	var set = $("#new-set-number").text();
	var exnum = $("#new-exercise-number").text();
	var exnam = $("#new-exercise-name").text();
	var sets = $("#new-exercise-sets").text();
	var reps = $("#new-exercise-reps").text();
	if(set != "" && exnum != "" && exnam != "" && sets != "" && reps != ""){
		$("#Exercise_Forms").append("
		<td class=\"set-number\" contentEditable=\"true\">"+set+"</td>
		<td class=\"exercise-number\" contentEditable=\"true\">"+exnum+"</td>
		<td class=\"exercise-name\">"+exnam+"</td>
		<td class=\"exercise-sets\" contentEditable=\"true\">"+sets+"</td>
		<td class=\"exercise-reps\" contentEditable=\"true\">"+reps+"</td>
		<td class=\"delete-ex-button\" onclick=function(){this.parent().remove();}>Delete</td>
		");

		$("#new-set-number").text() = "";
		$("#new-exercise-number").text() = "";
		$("#new-exercise-name").text() = "";
		$("#new-exercise-sets").text() = "";
		$("#new-exercise-reps").text() = "";
	}
}
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
	var full = $("#full_workout").val();
	var val = $("#week/day").val();
	var week = val.substring(0,val.indexOf("/"));
	var day = val.substring(val.indexOf("/")+1);
	var de = $("#workout_date").val().split("/");
	var day = de[0];
	var month = de[1];
	var year = de[2];
	var date = new Date(year,month,day,0,0,0,0);
	var d = date.UTC();
	var tblarr = [];
	var array = [];
	var tbllen = $("#Exercise_Forms").rows.length;
	for(var i=2;i<tbllen;i++){ //this first for loop puts the table into a more usable array
		var row = $("#Exercise_Forms").rows[i];
		tblarr.append({
			set:row.find(".set-number").val(),
			exnum:row.find(".exercise-number").val(),
			name:row.find(".exercise-name").val(),
			rounds:row.find(".exercise-sets").val(),
			reps:row.find(".exercise-reps").val()
		});
	}
	var sety =1;
	while (tblarr.length > 0){
		var setlist = [];
		for(var i=0;i<tblarr.length;i++){
			if(tblarr[i].set == set){
				setlist += tblarr[i];
				tblarr.splice(i,1);
			}
		}
		var loopy = true;
		while(loopy){ //sorting algorithm based on exnum
			var doopy = true;
			for(var i=1;i<setlist.length;i++){
				if(setlist[i].exnum < setlist[i-1].exnum){
					var a = setlist[i-1];
					var b = setlist[i];
					delete array[i-1];
					delete array[i];
					array[i-1] = b;
					array[i] = a;
					doopy = false;
				}
			}
			if(doopy){
				loopy=false;
			}
		}
		var set ={};
		var exercises = [];
		for(var i=0;i<setlist.length;i++){
			var exercise = {name:setlist[i].exnam}
			var rounds = [];
			var rdl = parseInt(setlist[i].sets);
			for(var j=0;j<rdl;j++){
				rounds.append({reps:setlist[i].reps})
			}
			exercise.rounds = rounds;
			exercises.append(exercise);
		}
		set.exercises = exercises;
		array.append(set);
		sety +=1;
	}
	var rowlen = $("#Exercise_Forms").rows.length; //erases the table
	for(var i=2;i<rowlen;i++){
		$("#Exercise_Forms").deleteRow(i);
	}
	$("#new-set-number").text() = "";
	$("#new-exercise-number").text() = "";
	$("#new-exercise-name").text() = "";
	$("#new-exercise-sets").text() = "";
	$("#new-exercise-reps").text() = "";
	socket.emit("createWorkout",full,array,d,week,day);
}