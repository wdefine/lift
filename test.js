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

var data = [
		  ['Date', 'Number'],
          ['2016/4/1',  1],
          ['2016/4/2',  2],
          ['2016/4/3',  10],
          ['2016/4/4',  5]
		  ];


app.get('/', function(request, response){
	response.render('test.html');

});

app.get('/test.json', function(request, response){
	response.send(data);
});

server.listen(8080, function() {
	console.log('Listening...');
});
