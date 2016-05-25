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

	$("#WorkoutDatePicker").datepicker({
		autoSize:true
	});
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
	socket.on("newFullWorkout",function(name){
		$("#full_workout").append("<option value=\""+name+"\">"+name+"</option>");
	});
	socket.on("workoutGroups",function(list){
		addGroups(list);
	});
	socket.on("groupWorkouts",function(list){
		addWorkouts(list);
	});
	socket.on("newUser",function(user){
		addUser(user);
	});
	socket.on("newGroup",function(group){
		addGroup(group);
	})
	///////////////////////////////////
	/////////Send 

	/*
	console.log($("#WorkoutName").val());
	//$("#Create_Workout_Nav_Button, #Create_sub_nav_bar").mouseenter(Sub_Bar_On).mouseleave(Sub_Bar_Off);
	$(document).on("click", "#SubmitWorkoutButton",function(){
		if ($("#WorkoutName").val() == "" || $("#CycleNum").val() == ""){
			//pop error message
		}
		else{
			console.log("poop");
			createWorkout()
		}
	});
	*/
	$(document).on("click", "#AssignWorkoutButton",function(){
		assignWorkout();
	});
	$(document).on("click", "#UnAssignWorkoutButton",function(){
		unAssignWorkout();
	});
	$(document).on("click", "#create_full_button",function(){
		createFull();
	});


	//For automatically sorting through users by name/email
	$(document).on("change", "#newgroupusername",function(){
		$("#newgroupuseremail").val($("#newgroupusername").val());
	});
	$(document).on("change", "#newgroupuseremail",function(){
		$("#newgroupusername").val($("#newgroupuseremail").val());
	});
	$(document).on("change", "#oldgroupusername",function(){
		$("#oldgroupuseremail").val($("#oldgroupusername").val());
	});
	$(document).on("change", "#oldgroupuseremail",function(){
		$("#oldgroupusername").val($("#oldgroupuseremail").val());
	});
	//Adding members to new group
	$(document).on("click", "#AddToNewGroupButton",function(){
		var row = document.getElementById("Workout_Post_Info").insertRow(-2);
		row.class = "MemberOfNewGroup";
		var cell1 = row.insertCell(0);
		var cell2 = row.insertCell(1);
		var cell3 = row.insertCell(2);
		cell1.class = "Name";
		cell1.value = $("#newgroupusername option:selected").html();
		cell1.innerHTML = $("#newgroupusername option:selected").html();
		cell2.class = "Email";
		cell2.value = $("#newgroupuseremail option:selected").html();
		cell2.innerHTML = $("#newgroupuseremail option:selected").html();
		cell3.innerHTML = "<button class=\"RemoveNewMemberButton\" onclick=\"deleteGroupy(this)\">-</button>";
	});
	//submitting new Group
	$(document).on("click", "#SubmitGroupButton",function(){
		createGroup();
	});
	$(document).on("change", "#AddGroupDrop", function(){
		getGroup();
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
	$(document).on("change", "#AssignWorkoutDrop", function(){
		getGroups();
	});
/*function Sub_Bar_On(){
	$("#Create_sub_nav_bar").show();
}
function Sub_Bar_Off(){
	$("#Create_sub_nav_bar").hide();
}*/
//done
});
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
			$("#Exercise_Forms").append(
			"<td class=\"set-number\" contentEditable=\"true\">"+set+"</td>"+
			"<td class=\"exercise-number\" contentEditable=\"true\">"+exnum+"</td>"+
			"<td class=\"exercise-name\">"+exnam+"</td>"+
			"<td class=\"exercise-sets\" contentEditable=\"true\">"+sets+"</td>"+
			"<td class=\"exercise-reps\" contentEditable=\"true\">"+reps+"</td>"+
			"<td class=\"delete-ex-button\" onclick=function(){this.parent().remove();}>Delete</td>"
			);
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
		$("#Exercise_Forms").append(
		"<td class=\"set-number\" contentEditable=\"true\">"+set+"</td>"+
		"<td class=\"exercise-number\" contentEditable=\"true\">"+exnum+"</td>"+
		"<td class=\"exercise-name\">"+exnam+"</td>"+
		"<td class=\"exercise-sets\" contentEditable=\"true\">"+sets+"</td>"+
		"<td class=\"exercise-reps\" contentEditable=\"true\">"+reps+"</td>"+
		"<td class=\"delete-ex-button\" onclick=function(){this.parent().remove();}>Delete</td>"
		);

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
function getGroups(){
	var workout = $("#AssignWorkoutDrop").val();
	if(workout != ""){
		socket.emit("getWorkoutGroups",workout);
	}
	else{
		$("#AssignGroupDrop").empty();
	}
}
function addGroups(list){
	for(var i=0;i<list.length;i++){
		$('#AssignGroupDrop').append("<option value=\""+list[i].group+"\">"+list[i].group+"</option>");
	}
}
function assignWorkout(){
	//this is where you assign the full workout above to a group of users
	var full = $("#AssignWorkoutDrop").val();//get full from dropdown
	var group = $("#AssignGroupDrop").val();//get group from dropdown
	console.log(full + " "+ group);
	if(full != "" && group != ""){
		socket.emit("assignWorkout", full, group);
		getGroups();
	}
}
function getWorkouts(){
	var group = $("#UnAssignGroupDrop").val();
	if(group != ""){
		socket.emit("getWorkoutGroups",workout);
	}
	else{
		$("#UnAssignWorkoutDrop").empty();
	}
}
function addWorkouts(list){
	for(var i=0;i<list.length;i++){
		$('#UnAssignWorkoutDrop').append("<option value=\""+list[i].workout+"\">"+list[i].workout+"</option>");
	}
}
function unAssignWorkout(){
	var full = $("#UnAssignWorkoutDrop").val();//get full from dropdown
	var group = $("#UnAssignGroupDrop").val();//get group from dropdown
	console.log(full + " "+ group);
	if(full != "" && group != ""){
		socket.emit("unAssignWorkout",full,group);
	}
}
//Deleting members from new group
function deleteGroupy(element){
	var grandma = element.parentNode.parentNode.rowIndex;
	$("#Workout_Post_Info").deleteRow(grandma);
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
function editGroupadd(){ //adds an additional user to a preexisting group
	var group = $("#AddGroupDrop").val();
	var name = $("#oldgroupusername").val();
	var email = $("#oldgroupuseremail").val();
	var user = {name:name, email:email};
	socket.emit("editGroupadd", group, user);
	addGroup([user]);
}
//done
function editGroupdelete(_this){ //removes a user from a group
	var group = $("#AddGroupDrop").val();
	var name = _this.parentNode.parentNode.find(".Name").val();
	var email = _this.parentNode.parentNode.find(".Email").val();
	var user = {name:name, email:email};//object with email and name
	socket.emit("editGroupdelete", group, user);
}
function getGroup(){
	var group = $("#AddGroupDrop").val();
	if(group != ""){
		$("#AddGroupDrop").val("");
		socket.emit("getGroupUsers",group);
	}
	else{
		var groupies = $('.Member');
		groupies.each(function(){
			this.parentNode.deleteRow(this.rowIndex);
		});
	}
}
function addGroup(list){
	var start = $('#header_existing').indexOf() +1;
	for(var i=0;i<list.length;i++){
		var row= document.getElementById('Group_Post_Info').insertRow(start);
		row.class = "Member";
		var c1 = row.insertCell(0);
		var c2 = row.insertCell(1);
		var c3 = row.insertCell(2);
		c1.class = "Name";
		c1.value = list[i].name;
		c2.class = "Email";
		c2.value = list[i].email;
		c3.innerHTML = "<button class=\"RemoveMemberButton\" onclick=\"editGroupdelete(this)\">-</button>";
		start +=1;
	}
}
//done
function createUser(){
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
//done
function createFullWorkout(){
	//this is where you create the fullworkout which is basically just the name, number of cycles(weeks),
	//and number of days in a cycle(days a week working out). You don'y even need dates for the workouts!
	var name = $("#WorkoutName").val();//get name from text field
	var cyclenum = $("#CycleNum").val();//get cyclenum from text field (make sure is a number)
	var cyclelen = $("#CycleLenDrop").val();//get cyclelen from text field (make sure is a number)
	//socket.emit("createFullWorkout",name,cyclenum,cyclelen);
}

function createWorkout(){
	var full = $("#full_workout").val();
	var val = $("#week/day").val();
	/*
	var week = val.substring(0,val.indexOf("/"));
	var day = val.substring(val.indexOf("/")+1);
	var de = $("#workout_date").val().split("-");
	var day = de[2];
	var month = de[1];
	var year = de[0];
	var date = new Date(year,month,day,0,0,0,0);
	*/
	var date = $("#WorkoutDatePicker").datepicker('getDate');
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
	$("#full_workout").val(''); 
	getFull();
}
function createFull(){
	var name = $("#full_name").val();
	var weeks = parseInt($("#cyclenum").val());
	var days = parseInt($("#cyclelen").val());
	socket.emit('createFullWorkout',name,weeks,days)
}
function addUser(user){
	if(user.email != null){
		$("#newgroupusername").append("<option value=\""+user.name+"/"+user.email+"\">"+user.name+"</option>");
		$("#newgroupuseremail").append("<option value=\""+user.name+"/"+user.email+"\">"+user.email+"</option>");
		$("#oldgroupusername").append("<option value=\""+user.name+"/"+user.email+"\">"+user.name+"</option>");
		$("#oldgroupuseremail").append("<option value=\""+user.name+"/"+user.email+"\">"+user.email+"</option>");
	}
}
function addGroup(group){
	if(group != null){
		$("#AddGroupDrop").append("<option value=\""+group+"\">"+group+"</option>");
		$("#UnAssignGroupDrop").append("<option value=\""+group+"\">"+group+"</option>");
	}
}


