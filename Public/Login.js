var socket = io.connect();
window.addEventListener('load', function(){
	$('#CreateAccount').hide();
	$('#LoginButton').on('click', function(){
		console.log("login");
		var username = $("#UsernameArea").val();
		var password = $("#PasswordArea").val();
		socket.emit("Login", username, password);	
	});
	$('#NewUserButton').on('click', function(){
		console.log("new user");
		var name = $("#NewUserFirstName").val() + " " + $("#NewUserLastName").val();
		var email = $("#NewUserEmail").val();
		var password = $("#NewUserPassword").val();
		socket.emit("createUser", name, password);	
	});
	$('#NewAccountButton').on('click', function(){
		$('#Login').hide();
		$('#CreateAccount').show();
	});



});