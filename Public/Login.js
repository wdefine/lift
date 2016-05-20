var socket = io.connect();
window.addEventListener('load', function(){
	$('#CreateAccount').hide();
	$('#LoginButton').on('click', function(){
		console.log("login");
		var username = $("#UsernameArea").val();
		var password = $("#PasswordArea").val();
		//do what ever needs to happen to authenticate user
	});
	$('#NewUserButton').on('click', function(){
		console.log("new user");
		var name = $("#NewUserFirstName").val() + " " + $("#NewUserLastName").val();
		var email = $("#NewUserEmail").val();
		var password = $("#NewUserPassword").val();
		socket.emit("createUser", name, email);	
	});
	$('#NewAccountButton').on('click', function(){
		$('#Login').hide();
		$('#CreateAccount').show();
	});



});