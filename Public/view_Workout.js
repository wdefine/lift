window.addEventListener('load', function(){
	//////////////////////
	////initial hides/////
	//////////////////////
	show_only("Table", "Excersie_1_Set_1")

	$('table').on("click",function(){
		console.log("Table Tapped");
		var table_id = $(this).attr("id");	
		console.log(table_id);
		show_only("table", table_id);
	});

	$("#Workout_bar li").on("tap",function(){
		console.log("Date Bar Tapped");
		$(this).css("background-color", '#ffffff' )
	});
	$("#Workout_bar li").mouseup(function(){
		$(this).css("background-color", '#323333' )
	});
	
	$("table").on("swipe",function(){
		$(this).hide();
	}); 
	


});

function sendWorkoutData(){
	socket.emit
}

function show_only(elementType, shownElement,  ){
	var elements = document.getElementsByTagName(""+elementType+"");
	for(var i = 0; i < elements.length; i++){
		console.log("function run");
   		if(elements[i].getAttribute('id') == document.getElementById(shownElement).getAttribute('id')){
   			elements[i].style.display = 'block';
   			console.log("match");
   		}
   		else{
   			elements[i].style.display = 'none';
   			console.log("not match");
   		}
	}
}

