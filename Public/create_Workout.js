//NOTE: lots of things are happening on this page. It may be easier on the user
// to break this into multiple pages. There are more possible functions than the
//ones down there too. Lets get the basics down first.
///populate dropdowns from server

var unfinished = [];
var finished = [];
var killswitch;
var socket = io.connect('http://localhost:8080');
$(document).ready(function(){
	$("#Workout_date").datepicker();
});

window.addEventListener('load', function(){
	document.getElementById("full_workout").selectedIndex = "0";
	document.getElementById("AssignWorkoutDrop").selectedIndex = "0";
	$('#Create_Full_Workout_Page').hide();
	$("#Create_Workout_Nav_Button").css("background-color", "#3a3a3a");
	$("#Create_Group_Page").hide();
	$("#Create_Account_Page").hide();
	$("#View_Progress_Page").hide();
	$("#Assign_Workout_Page").hide();
	$("#Create_Workout_Page").show();
	$("#Create_Excercise_Page").hide();

	///////////////////////////////////
	/////Page Navigation//////////////
	//////////////////////////////////
	//will clean up later
	$("delete-ex-button").hover

	$(".nav_bar_link").hover(function(){
		$(this).css("background-color", "#b04f66");
	}, function(){
		if ($(this).prop("name") == "true"){
			$(this).css("background-color", "#3a3a3a");
		}
		if ($(this).prop("name") == "false"){
			$(this).css("background-color", "#843849");
		}
	});
	$(".nav_bar_link").click(function(){
		$(".nav_bar_link").each(function(){
			$(this).css("background-color", "#843849");
			$(this).attr("name", "false");
		});
		$(this).css("background-color", "#3a3a3a");
		$(this).attr("name", "true");
	});
	$("#Create_Excercise_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').hide();
		$("#Create_Group_Page").hide();
		$("#Create_Account_Page").hide();
		$("#View_Progress_Page").hide();
		$("#Assign_Workout_Page").hide();
		$("#Create_Workout_Page").hide();
		$("#Create_Excercise_Page").show();

	});
	$("#Create_Workout_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').hide();
		$("#Create_Group_Page").hide();
		$("#Create_Account_Page").hide();
		$("#View_Progress_Page").hide();
		$("#Assign_Workout_Page").hide();
		$("#Create_Workout_Page").show();
		$("#Create_Excercise_Page").hide();
	});
	$("#Create_Group_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').hide();
		$("#Create_Group_Page").show();
		$("#Create_Account_Page").hide();
		$("#View_Progress_Page").hide();
		$("#Assign_Workout_Page").hide();
		$("#Create_Workout_Page").hide();
		$("#Create_Excercise_Page").hide();
	});
		$("#View_Progress_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').hide();
		$("#Create_Group_Page").hide();
		$("#Create_Account_Page").hide();
		$("#View_Progress_Page").show();
		$("#Assign_Workout_Page").hide();
		$("#Create_Workout_Page").hide();
		$("#Create_Excercise_Page").hide();
	});
	$("#Assign_Workout_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').hide();
		$("#Create_Group_Page").hide();
		$("#Create_Account_Page").hide();
		$("#View_Progress_Page").hide();
		$("#Assign_Workout_Page").show();
		$("#Create_Workout_Page").hide();
		$("#Create_Excercise_Page").hide();
	});
	$("#Create_User_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').hide();
		$("#Create_Group_Page").hide();
		$("#Create_Account_Page").show();
		$("#View_Progress_Page").hide();
		$("#Assign_Workout_Page").hide();
		$("#Create_Workout_Page").hide();
		$("#Create_Excercise_Page").hide();
	});
	$("#Create_Full_Workout_Nav_Button").click(function(){
		$('#Create_Full_Workout_Page').show();
		$("#Create_Group_Page").hide();
		$("#Create_Account_Page").hide();
		$("#View_Progress_Page").hide();
		$("#Assign_Workout_Page").hide();
		$("#Create_Workout_Page").hide();
		$("#Create_Excercise_Page").hide();
	});


	socket.on("fullWorkout",function(list){
		console.log("fullWorkout received",list);
		sortFull(list);
	});
	socket.on("blankWorkout",function(array){ //////////////this is bad
		console.log("blankWorkout received");
		fillWorkout(array);
	});
	socket.on("newFullWorkout",function(name,ident){
		console.log("newFullWorkout received");
		$("#full_workout").append("<option value=\""+ident+"\">"+name+"</option>");
		$("#AssignWorkoutDrop").append("<option value=\""+ident+"\">"+name+"</option>");
	});
	socket.on("groups",function(list){
		console.log("workoutGroups received",list);
		addGroups(list);
	});
	socket.on("workouts",function(list){
		console.log("groupWorkouts received",list);
		addWorkouts(list);
	});
	socket.on("newUser",function(user){
		console.log("newUser received");
		addUser(user);
	});
	socket.on("newGroup",function(group){
		console.log("newGroup received");
		addGroup(group);
	});
	socket.on("groupUsers",function(list){
		console.log("group users ", list);
		addUsers(list);
	})
	socket.on("newExercise", function(name){
		$(".Excercise_Drop").append('<option class="Exercise-name" value="'+name+'"">{{exercise}}</option>');
	});
	///////////////////////////////////
	/////////Send 
	$(document).on("click", "#AddToOldGroupButton",function(){
		editGroupadd();

	});

	$(document).on("click", "#SubmitWorkoutButton",function(){
		console.log("create workout button pressed");
		killswitch = true;
		createWorkout()
	});
	$(document).on("click", "#submit-ex-button",function(){
		console.log("Submit ex");
		submitEx();
	});
	$(document).on("click", "#AssignWorkoutButton",function(){
		console.log("Assign Workout");
		assignWorkout();
	});
	$(document).on("click", "#UnAssignWorkoutButton",function(){
		console.log("Un assign workout");
		unAssignWorkout();
	});
	$(document).on("click", "#create_full_button",function(){
		console.log("full created");
		createFull();
	});
	$(document).on("click", "#SubmitExcerciseButton",function(){
		console.log("excercise submit");
		var excercise_Name = $("#New_Exercise_Name").val();
		var excercise_URL = $("#New_Excercise_Url").val();
		console.log( "excercise name: "+excercise_Name + " URl: " + excercise_URL);
		socket.emit("createExercise", excercise_Name, excercise_URL);
		
	});
	$(document).on("click", "#EditExcerciseButton",function(){
		console.log("excercise edit");
		var excercise_Name = $("#edit_new-exercise-name").val();
		var excercise_URL = $("#edit_New_Excercise_Url").val();
		console.log( "excercise name: "+excercise_Name + " URl: " + excercise_URL);
		socket.emit("editExerciseUrl", excercise_Name, excercise_URL);
		
	});
	$(document).on("click",".memberRemoveButton", function(){
		editGroupdelete($(this));
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
		console.log("add to group button pressed")
		var l = $('#Workout_Post_Info tr').length;
		console.log(l);
		var row = document.getElementById("qwerty").parentNode.insertRow(6);
		row.className = "MemberOfNewGroup";
		var cell1 = row.insertCell(0);
		var cell2 = row.insertCell(1);
		var cell3 = row.insertCell(2);
		cell1.className = "Name";
		var nameemail = $("#newgroupusername").val();
		var x = nameemail.indexOf("/");
		var name = nameemail.substring(0,x);
		var email = nameemail.substring(x+1);
		cell1.value = name;
		cell1.innerHTML = name;
		cell2.className = "Email";
		cell2.value = email;
		cell2.innerHTML = email;
		cell3.innerHTML = "<button class=\"RemoveNewMemberButton\">Delete</button>";
		cell3.onclick = function(){this.parentNode.remove();}
	});
	//submitting new Group
	$(document).on("click", "#SubmitGroupButton",function(){
		console.log("Submit Group");
		createGroup();
	});
	$(document).on("change", "#AddGroupDrop", function(){
		console.log("Add group");
		getGroup();
	});
	$(document).on("click", "#CreateNewUserButton", function(){
		console.log("create new user");
		createUser();
	});
	$(document).on("change", "#full_workout", function(){
		getFull();
	});
	$(document).on("change", "#week-day", function(){
		getWeekDay();
	});
	$(document).on("change", "#AssignWorkoutDrop", function(){
		getGroups();
	});
	$(document).on("change", "#UnAssignGroupDrop", function(){
		console.log("change received");
		getWorkouts();
	});
});
function addUsers(list){
	for(var i=0;i<list.length;i++){
		$("#AddMemberRow").before("<tr class='Member' id ='member_Row_"+i+"'></tr>");
		$("#member_Row_"+i).append("<td id ='member_Row_"+i+"_Name'>"+list[i].name+"</td>");
		$("#member_Row_"+i).append("<td id ='member_Row_"+i+"_Email'>"+list[i].email+"</td>");
		$("#member_Row_"+i).append("<td><button class='memberRemoveButton' id='"+i+"_Remove'>Remove</button></td>");
		$("#"+i+"_Remove").data("Email",list[i].email);
		$("#"+i+"_Remove").data("Name",list[i].name);
/*		
		var row = document.getElementById("AddMemberRow").parentNode.insertRow(5);
		var c1 = row.insertCell(0);
		var c2 = row.insertCell(1);
		var c3 = row.insertCell(2);
		console.log(c1);
		c1.text(""+list[i].name);
	*/
	}
}
function getFull(){
	console.log("getFull called");
	var full = $("#full_workout").val();
	console.log(full);
	if(full == ""){
		$("#week-day").empty();
		$("#week-day").append("<option value=\"\">Week x, Day y</option>");
		finished = [];
		unfinished = [];
	}
	else{
		$("#week-day").empty();
		$("#week-day").append("<option value=\"\">Week x, Day y</option>");
		finished = [];
		unfinished = [];
		socket.emit("getFullWorkout", full);
	}
}
function sortFull(list){
	for(var i=0;i<list.length;i++){
		if(list[i].skip == true){
			finished.push(list[i]);
			$("#week-day").append("<option value=\""+list[i].cycle+"/"+list[i].day+"\">Week "+list[i].cycle+", Day "+list[i].day+"</option>");
		}
		else{
			unfinished.push(list[i]);
		}
	}
}
function getWeekDay(){  //this is why we have fulls, if user has already created week 1 day 1 workout, 
						//then week 2 day 1 workout will be filled in for the user
	var val = $("#week-day").val();
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
			var row = document.getElementById("efr1").parentNode.insertRow(3);
			var c1 = row.insertCell(0);
			var c2 = row.insertCell(1);
			var c3 = row.insertCell(2);
			var c4 = row.insertCell(3);
			var c5 = row.insertCell(4);
			var c6 = row.insertCell(5);
			c1.innerHTML = "<input type=\"number\" value=\""+set+"\" min=\"1\" max=\"20\">";
			//c1.childNode.val(sets);
			c2.innerHTML = "<input type=\"number\" value=\""+exnum+"\" min=\"1\" max=\"20\">";
			c3.innerHTML = exnam;
			c4.innerHTML = "<input type=\"number\" value=\""+sets+"\" min=\"1\" max=\"20\">";
			c5.innerHTML = "<input type=\"number\" value=\""+reps+"\" min=\"1\" max=\"1000\">";
			c6.innerHTML = "Delete";
			c1.className = "set-number";
			c2.className = "exercise-number";
			c3.className = "exercise-name";
			c4.className = "exercise-sets";
			c5.className = "exercise-reps";
			c6.className = "delete-ex-button";
		}
	}
}
function submitEx(){
	var set = $("#new-set-number").val();
	var exnum = $("#new-exercise-number").val();
	var exnam = $("#new-exercise-name").val();
	var sets = $("#new-exercise-sets").val();
	var reps = $("#new-exercise-reps").val();
	console.log(set,exnum,exnam,sets,reps);
	if(set != "" && exnum != "" && exnam != "" && sets != "" && reps != ""){
		var l = $('#Exercise_Forms tr').length;
		console.log(l);
		var row = document.getElementById("efr1").parentNode.insertRow(3);
		var c1 = row.insertCell(0);
		var c2 = row.insertCell(1);
		var c3 = row.insertCell(2);
		var c4 = row.insertCell(3);
		var c5 = row.insertCell(4);
		var c6 = row.insertCell(5);
		c1.innerHTML = "<input type=\"number\" value=\""+set+"\" min=\"1\" max=\"20\">";
		//c1.childNode.val(sets);
		c2.innerHTML = "<input type=\"number\" value=\""+exnum+"\" min=\"1\" max=\"20\">";
		c3.innerHTML = exnam;
		c4.innerHTML = "<input type=\"number\" value=\""+sets+"\" min=\"1\" max=\"20\">";
		c5.innerHTML = "<input type=\"number\" value=\""+reps+"\" min=\"1\" max=\"1000\">";
		c6.innerHTML = "Delete";
		c1.className = "set-number";
		c2.className = "exercise-number";
		c3.className = "exercise-name";
		c4.className = "exercise-sets";
		c5.className = "exercise-reps";
		c6.className = "delete-ex-button";
		/*
		c1.contentEditable = true;
		c2.contentEditable = true;
		c4.contentEditable = true;
		c5.contentEditable = true;
		c1.type = "number";
		c1.min ="1";
		c1.max ="20";
		*/
		c6.onclick = function(){this.parentNode.remove();}

		$("#new-set-number").val("");
		$("#new-exercise-number").val("");
		$("#new-exercise-name").val("");
		$("#new-exercise-sets").val("");
		$("#new-exercise-reps").val("");
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
		console.log(workout);
		socket.emit("getGroups");
	}
	else{
		$("#AssignGroupDrop").empty();
	}
}
function addGroups(list){
	document.getElementById("AssignGroupDrop").innerHTML = "";
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
		socket.emit("assignWorkout", group,full);
		getGroups();
	}
}
function getWorkouts(){
	var group = $("#UnAssignGroupDrop").val();
	if(group != ""){
		socket.emit("getWorkouts", group);
	}
	else{
		$("#UnAssignWorkoutDrop").empty();
	}
}
function addWorkouts(list){
	for(var i=0;i<list.length;i++){
		$('#UnAssignWorkoutDrop').append("<option value=\""+list[i].full+"\">"+list[i].workout+"</option>");
	}
}
function unAssignWorkout(){
	var full = $("#UnAssignWorkoutDrop").val();//get full from dropdown
	var group = $("#UnAssignGroupDrop").val();//get group from dropdown
	console.log(full + " "+ group);
	if(full != "" && group != ""){
		socket.emit("unassignWorkout",group,full);
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
	console.log(name,array);
	socket.emit("createGroup",name,array);
}
//done
function editGroupadd(){ //adds an additional user to a preexisting group
	var group = $("#AddGroupDrop").val();
	var nameval = $("#oldgroupusername").val();
	var nameslashindex = nameval.indexOf("/");
	var name = nameval.substring(0,nameslashindex);
	console.log(name);
	var emailval = $("#oldgroupuseremail").val();
	var emailslashindex = emailval.indexOf("/");
	var email = emailval.substring(emailslashindex+1,emailval.length);
	console.log(email);
	var user = {name:name, email:email};
	console.log("UserName: "+ user.name+" UserEmail: "+user.email+ "group: "+group);
	socket.emit("editGroupadd", group, user);
	addGroup([user]);
	getGroup();//update the page
}
//done
function editGroupdelete(_this){ //removes a user from a group
	console.log("edit group delete");
	console.log(_this);
	var group = $("#AddGroupDrop").val();
	var name = _this.data("Name");
	var email = _this.data("Email")
	console.log(name + "     "+email);
	var user = {name:name, email:email};//object with email and name
	console.log(user.email);
	socket.emit("editGroupdelete", group, user);
	var id = _this.attr("id");
	var rowNum = id.charAt(0);//I know its not beautiful but it works
	getGroup();//update the page
	//$("#member_Row_"+rowNum).remove();//remove the row of the person removed from group

}
function getGroup(){
	if($(".Member").length > 0){
		$(".Member").remove();//clear table if a new group is selected
	}
	console.log("getGroupCalled");
	var group = $("#AddGroupDrop").val();
	if(group != ""){
		console.log("this");
		console.log(group);
		socket.emit("getGroupUsers",group);
		//$("#AddGroupDrop").val("");
	}
	else{
		console.log("that");
		var groupies = $('.Member');
		groupies.each(function(){
			this.parentNode.deleteRow(this.rowIndex);
		});
	}
}
function addGroup(list){
	var start = $('#header_existing').indexOf() +1;
	console.log("start: "+start)
	for(var i=0;i<list.length;i++){
		var row = document.getElementById('Group_Post_Info').insertRow(start);
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
//done7
function createUser(){
	var name = $("#NewUserFirstName").val() + " " + $("#NewUserLastName").val();
	var email = $("#NewUserEmail").val();
	var status = $("#statusDrop").val();
	console.log(name + " "+ email);
	socket.emit("createUser",name,email,status);
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
	socket.emit("createFullWorkout",name,cyclenum,cyclelen);
}

function createWorkout(){
	console.log("here 1");
	var tblarr = [];
	var array = [];
	var tblrows = document.getElementById("Exercise_Forms").rows;
	for(var i=3;i<tblrows.length-1;i++){ //this first for loop puts the table into a more usable array
		var rowe = tblrows[i];
		var cells = rowe.cells;
		tblarr.push({
			set:cells[0].firstChild.value,
			exnum:cells[1].firstChild.value,
			name:cells[2].innerHTML,
			rounds:cells[3].firstChild.value,
			reps:cells[4].firstChild.value
		});
	}
	console.log("here 2");
	getNextSet(array,tblarr,1,true);
}
function getNextSet(array,tblarr,sety,done){
	if(done && killswitch){
		console.log("bigger tblarr", tblarr)
		console.log("starting loop 1  -do 1 loop for every set");
		var setlist = [];
		console.log("empty setlist: ",setlist);
		console.log(tblarr.length);
		for(var i=0;i<tblarr.length;){
			if(tblarr[i].set == sety){
				setlist.push(tblarr[i]);
				tblarr.splice(i,1);
			}
			else{
				i++;
			}
		}
		console.log("smaller tblarr: ",tblarr);
		console.log("full setlist: ",setlist);
		orderSetlist(array,tblarr,sety,setlist,true);
	}
	else if(killswitch){
		killswitch = false;
		var tblrows = document.getElementById("Exercise_Forms").rows;
		var date = $("#workout_date").val();
		var d = Date.UTC(date.substring(0,4),date.substring(5,7),date.substring(8,10));
		var full = $("#full_workout").val();
		var val = $("#week-day").val();
		var x = val.indexOf("/");
		var week = val.substring(0,x);
		var day = val.substring(x+1);
		for(var i=3;i<tblrows.length-1;){
			document.getElementById("Exercise_Forms").deleteRow(i);
		}
		$("#new-set-number").val("");
		$("#new-exercise-number").val("");
		document.getElementById("new-exercise-name").selectedIndex = "0";
		$("#new-exercise-sets").val("");
		$("#new-exercise-reps").val("");
		console.log("fuck yes jesus", full,array,d,week,day);
		socket.emit("createWorkout",full,array,d,week,day);
		document.getElementById("full_workout").selectedIndex = "0"; 
		getFull();
	}
}
function orderSetlist(array,tblarr,sety,setlist,loopy){
	while(loopy && killswitch){ //sorting algorithm based on exnum
		console.log("sorting loop 2");
		var doopy = true;
		for(var i=1;i<setlist.length;i++){
			if(setlist[i].exnum < setlist[i-1].exnum){
				console.log("old setlist: ",setlist);
				var a = setlist[i-1];
				var b = setlist[i];
				setlist.splice(i-1,2);
				setlist.push(b);
				setlist.push(a);
				doopy = false;
				console.log("new setlist: ",setlist);
			}
		}
		if(doopy){
			if(setlist.length != 0){
				console.log("we have sorted a set this should appear for number of sets");
				console.log("tblarr: ",tblarr);
				console.log("tblarr length:", tblarr.length)
				console.log("setlist: ",setlist);
				var set ={};
				var exercises = [];
				console.log("exercises: ",exercises);
				console.log("setlist.length: ", setlist.length);
				for(var i=0;i<setlist.length;i++){
					var exercise = {name:setlist[i].name}
					var rounds = [];
					console.log("rounds: ",rounds);
					var rdl = setlist[i].rounds;
					console.log("round length", rdl);
					for(var j=0;j<rdl;j++){
						rounds.push({reps:setlist[i].reps})
					}
					console.log("rounds: ",rounds);
					exercise.rounds = rounds;
					exercises.push(exercise);
					console.log("exercise push", exercise);
				}
				console.log("exercises: ",exercises);
				set.exercises = exercises;
				console.log("set: ",set);
				array.push(set);
			}
			if(tblarr.length == 0){
				console.log("i should get here once");
				loopy = false;
				getNextSet(array,tblarr,sety+1,false);
			}
			else{
				console.log("what the fuck is tblarr", tblarr, tblarr.length);
				getNextSet(array,tblarr,sety+1,true);
			}
	    }
	    else{
	    	orderSetlist(array,tblarr,sety,setlist,loopy)
	    }
	}
}
function createFull(){
	var name = $("#full_name").val();
	var weeks = parseInt($("#cyclenum").val());
	var days = parseInt($("#cyclelen").val());
	console.log(name,weeks,days);
	if(name != ''){
		socket.emit('createFullWorkout',name,weeks,days);
	}
	$("#full_name").val('');
	$("#cyclenum").val(1);
	$("#cyclelen").val(1);
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


