var http = require('http');
var express = require('express');
var app = express();
var anyDB = require('any-db');
var engines = require('consolidate');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
app.engine('html', engines.hogan); // tell Express to run . html files through Hogan
app.set('views', __dirname + '/Templates'); // tell Express where to find templates
app.use(express.static(__dirname + '/Public'));
var conn = anyDB.createConnection('sqlite3://example.db.sqlite');


app.get('/', function(request, response){
	response.render('view_Workout.html');

});

app.get('/user/:name', function(request, response){
	var name = request.params.name;

	response.render('view_Workout.html', {
			"name": name
	});
});

app.get('/json/:name', function(request, response){
	var name = request.params.name;
	var wolist = [];
	conn.query('SELECT * FROM ' + name + ";'").on('data', function(row){
		wolist.push(row);
		}).on('end', function(){
			response.send(wolist);
	}); // probably need to make this sql injection-proof
});


app.get('/view', function(request, response){
	response.render('view_Workout.html');
});

server.listen(8080, function() {
	console.log('Listening...');
});
