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
				wo.shift();
				wo.shift();
				wo.shift();
				console.log(wo.length); // prints out 4 with this test file
				for(var i=0; i<wo.length;i++){ // this creates 1 graph for each workout, but this loop strangely only runs once
					console.log(i); 
					$("#test").append("<div id=" + wo[i] + "></div>"); // this creates a div with the name of the workout to put the graph in
					var table = [["date", wo[i]]]; // this creates an array with the keys "date" and "name of workout"
					for(var q=0;q<data.length;q++){ // loops through the number of data entries
						table.push([data[q]["date"], data[q][wo[i]]]); // adds a date - number of reps pairing to the array
						}
					

					google.charts.setOnLoadCallback(function(){ // google charts shenanigans
					var d = new google.visualization.arrayToDataTable(table);
					var chart = new google.visualization.LineChart(document.getElementById(wo[i]));
					var options = {
				          title: wo[i].replace(/_/g, " "),
				          curveType: 'function',
				          legend: { position: 'none' }
				        };
					chart.draw(d, options);
				});
				}
			}
		});

});

