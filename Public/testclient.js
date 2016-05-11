google.charts.load('current', {'packages':['corechart']});



window.addEventListener('load', function(){
	$.ajax({
		"url": "/test.json",
		"type": "GET",
		"datatype": 'json',
		"success": function (data){
			console.log(data);
			var d = new google.visualization.arrayToDataTable(data);
			var options = {title: "Deadlift", curveType: 'function', legend: {position: 'bottom'}};
			var chart = new google.visualization.LineChart(document.getElementById('sc'));
			chart.draw(d, options);
		}
	})

});
