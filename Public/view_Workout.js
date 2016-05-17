google.charts.load('current', {'packages':['corechart']});

window.addEventListener('load', function(){
	var name = $("meta[name='metatag']").attr('content'); // meta tag trick
	$.ajax({
		"url": "/json/wdefine",
		"type": "GET",
		"datatype": 'json',
		"success": function(data){
				var wo = Object.keys(data[0]); // wo is the name of the workout. for some reason everything in whatever.json is data[0]
				var len = data.length; // this and the shifts below get rid of the metadata in the json and find the key name of each workout
				wo.shift(); // shift tosses the first object in the array, this tosses the "workout" key
				wo.shift(); // this tosses the "completed" key
				wo.shift(); // this tosses the "date" key
				for(var i=0; i<wo.length;i++){ // this creates 1 graph for each workout, but this loop strangely only runs once
					$("#accordion").append("<h3>" + wo[i].replace(/_/g, " ") + "</h3>");
					var accordionContent = document.createElement('div');
					$(accordionContent).attr('id', wo[i]);
					var table = [["date", wo[i]]]; // this creates an array with the keys "date" and "name of workout"
					for(var q=0;q<data.length;q++){ // loops through the number of data entries
						table.push([data[q]["date"], data[q][wo[i]]]); // adds a [date, numberOfReps] pairing to the array
						}
					

					google.charts.setOnLoadCallback(function(){ // google charts shenanigans
						var d = new google.visualization.arrayToDataTable(table);
						var chart = new google.visualization.LineChart(accordionContent);
						var options = {
					          title: wo[i].replace(/_/g, " "),
					          curveType: 'function',
					          legend: { position: 'none' }
					        };
						chart.draw(d, options);
						$("#accordion").append(accordionContent);
					});
				}
				 $(function() {
				  $( "#accordion" ).accordion({
				      collapsible: true
				    	});
				  });
				 
			}
		});

});


