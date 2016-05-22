/*TODO LIST
2. make editing workout possible!
3. start writing mustahce files!
7. Make asynchronous adjustments!!!
7a) is get_max_from_list correct
7b) check over everything
*/


var Q = require('q');//new code

var http = require('http'); 
var express = require('express');
var app = express();
var server = http.createServer(app); 

var io = require('socket.io').listen(server);
var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://weightroom.db.sqlite');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var engines = require('consolidate');
app.engine('html', engines.hogan); 
app.set('views', __dirname +'/templates'); 

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({secret:'MySecret'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname + '/public'));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// used to deserialize the user 
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
            clientID: '151185493239-abvb78jd1o7iemphu6o5qm8sd7s8jnri.apps.googleusercontent.com',
            clientSecret: 'jGwAUsoOAujL9jmQMOAGuiyI',
            callbackURL: "http://localhost:8080/auth/google/callback"//problem line
        },
        function(token, refreshToken, profile, done) {
            conn.query('INSERT INTO backfill (email,digits) VALUES ($1,$2)',[profile._json.emails[0].value,profile._json.id]);
            if (profile._json.domain == 'stab.org' || profile._json.domain == 'students.stab.org') { 
                done(null, profile);
            }
            else{
                done(null, null);
            }
    })
);

app.get('/auth/google', passport.authenticate('google',{scope: 'https://www.googleapis.com/auth/plus.me https://www.google.com/m8/feeds https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'}));

app.get('/auth/google/callback', function (req, res) {
    console.log("Trying to authenticate");
    passport.authenticate('google', {
        successRedirect: '/submit', /* TODO: This is the name of the page you would like the user to go to once they are signed in */
        failureRedirect: '/auth/google'
    })(req, res);
});

app.get('/logout', function (req, res) {
    req.logOut();
    res.redirect('/');
});

io.on('connection', function(socket) {
    socket.on('getNextWorkout',function(workout,email){ //all
        table_to_array(workout,email, function(array){socket.emit('nextWorkout',array);});
    });
    socket.on('getGroupWorkouts',function(group){ //admin
        get_assigned_wo(group,function(list){socket.emit('groupWorkouts',list);});
    });
    socket.on('getWorkoutGroups',function(workout){ //admin
        get_assigned_gro(workout,function(list){socket.emit('workoutGroups',list);});
    });
    socket.on('getGroupUsers',function(group){ //admin
        get_group(group,function(list){socket.emit('groupUsers',list);});
    });
    socket.on('submitMax',function(email,exercise,max){ //all
        update_col("users",exercise.split(' ').join('_'),max,"email",email);
    });
    socket.on('changeWorkout',function(email,workout,str,value,completed){ //all 
        update_workout(str,value,completed,email,workout);
    });
    socket.on('submitWorkout',function(email,workout,date){ //all
        submit_workout(email,workout,date);
    });
    socket.on('createExercise',function(name,url){ //admin
        var name = name.split(' ').join('_');
        new_exercise(name,url,function(name){
            socket.emit('newExercise',name);
        });
    });
    socket.on('editExerciseUrl',function(name,url){ //admin
        update_col("exercises","url",url,"name",name.split(' ').join('_'));
    });
    socket.on('createGroup',function(name,array){ //admin
        new_group(array,name,function(name){
            socket.emit('newGroup',name);
        });
    });
    socket.on('editGroupadd',function(name,user){ //admin
        push_group(user,name);
    });
    socket.on('editGroupdelete',function(name,user){ //admin
        pop_group(user.email,name);
    });
    socket.on('assignWorkout',function(group,full){ //admin
        assign_full_workout(group,full);
    });
    socket.on('unassignWorkout',function(group,full){//admin
        unassign_workout(group,full);
    });
    socket.on('changeWorkoutDate',function(workout,date){
        change_date(workout,date);
    });
    socket.on('createFullWorkout',function(name,cyclenum,cyclelen){ //admin
        create_fullworkout(cyclenum,cyclelen,name);
    });
    socket.on('createWorkout',function(full,array,date,cycle,day){ //admin 
        create_workout(array,date,cycle,day,full,function(workout){
            update_col(workout,"completed",true,"email","email");
        });
    });
    socket.on('deleteWorkout',function(workout){ //admin
        delete_workout(workout);
    });
    socket.on('getFullWorkout',function(full){ //admin
        wo_in_full(full,function(list){
            socket.emit('fullWorkout',list);
        });
    });
    socket.on('getBlankWorkout',function(workout){ //admin
        table_to_array(workout,"email",function(array){socket.emit('blankWorkout',array);});
    });
    socket.on('createUser',function(name,email){ //admin
        new_user(name,email,function(obj){
            socket.emit('newUser',obj);
        });
    });
    socket.on('getGroupExerciseData',function(group){ //admin
        get_group_data(group,function(obj){
            socket.emit('groupExerciseData',obj);
        });
    });
    socket.on('getUserData',function(email){ //all
        get_user_data(email,function(obj){
            socket.emit('userData',obj);
        });
    });
});
function get_email(req,callback){
    var email = null;
    var domain;
    conn.query('SELECT email FROM backfill WHERE "digits"=($1)',[req])
    .on('data',function(row){
        email= row.email;
        domain = email.slice(email.indexOf('@'));
        callback(email,domain);
    })
    .on('end',function(){
        if(email == null){
            callback(null,null);
        }
    });
}
function ensureAuthenticated(req, res, next) { //next runs the next function in the arguement line "app.get('/datapage', ensureAuthenticated, function(req, res)" would move to function(req, res)
        if (req.user || req.isAuthenticated()) {    // is the user logged in?
            // proceed normally
            return next();
        } else {                                    // user is not logged in
            res.redirect('/auth/google');
        }
}
app.get('/', function(request, response){//
    get_email(request.user,function(email,domain){
        if(email == null){
            response.redirect('/login');
        }
        else{
            get_next_wo(email,function(email,workout){
                table_to_array_2(workout,email,email,null,function(array,workout,email,n){
                    get_all_false(email,workout,array,function(email,workout,array,allworkouts){
                        response.render('view_Workout.html',[email:email,workout:workout,allworkouts:allworkouts]/*mustahce in workout and allworkouts*/);
                    });
                });
            });
        }
    });
});
app.get('/login',function(request,reponse){
    reponse.render('login.html');
});
app.get('/create',function(request,response){
    get_email(request.user,function(email,domain){
        if(email == null){
            response.redirect('/login');
        }
        else{
            if(domain == "stab.org"){
                get_all_groups(function(groups){
                    get_all_full(groups,function(groups,workouts){
                        get_all_exercises(groups,workouts,function(groups,workouts,exercises){
                            get_all_users(groups,workouts,exercises,function(groups,workouts,exercises,users){
                                response.render('create-workout.html',[groups:groups, workouts:workouts, exercises:exercises, users:users]);
                            });
                        });
                    });
                });
            }
            else{
                response.redirect('/');
            }
        }
    });
});
app.get('/progress', function(request, response){
    get_email(request.user,function(email,domain){
        if(email == null){
            response.redirect('/login');
        }
        else{
            get_user_data(email,function(data){
                get_all_exercises(data,null,function(groups,workouts,exercises){
                    var data = groups;
                    response.render('user-progress.html'/*mustache in above data-data&exercises*/);
                });
            });
        }
    });   
});

server.listen(8080);
function getRealDate(number){
    var d = new Date(number);
    var date = d.toJSON().substring(0,10);
    return date; 
}
////////////////////////////////////////////////////////////USERS////////////////////////////////////////////////
function new_user(name,email,callback){
    conn.query('INSERT INTO users (name,email) VALUES ($1,$2)',[name,email])
    .on('error',function(){
        return null;
    })
    .on('end',function(){
        conn.query('CREATE  TABLE IF NOT EXISTS ($1) ("workout" TEXT ,"completed" BOOL, "skipped" BOOL, "date" INTEGER)', [email])
        .on('error',function(){
            return null;
        })
        .on('end',function(){
            var exercises = [];
            conn.query('SELECT exercise FROM exercises')
            .on('data',function(row){
                exercises.push(row.exercise.split('_').join(' '));
            })
            .on('end',function(){
                for(var i = 0;i<exercises.length;i++){
                    conn.query('ALTER TABLE ($1) ADD '+exercises[0]+' FLOAT',[email]);
                }
                callback({name:name, email:email});
            });
        });
    });
}
function get_all_users(groups,workouts,exercises,callback){
    var users = [];
    conn.query('SELECT name,email FROM users')
    .on('data',function(row){
        var user = {name:row.name, email:row.email}
        users.push(user);
    })
    .on('end',function(){
        callback(groups,workouts,exercises,users);
    });
}
function get_next_wo(email,workout,array,callback){
    var date = new Date();
    var d= date.UTC();
    var newest = d;
    var workout = null;
    conn.query('SELECT workout,date FROM ($1) WHERE "completed"=($2),"skipped"=($3) "date">($4)',[email,false,false,date])
    .on('data',function(row){
        if(row.date < (d-172800000)){ //48 hours after it is assumed that workout has been skipped
            update_col(email,"skipped",true,"workout",row.workout);
        }
        if(row.date < newest){
            row.date = newest;
            workout = row.workout;
        }
    })
    .on('end',function(){
        if(workout == null){
            callback(email,[]);
        }
        else{
            callback(email,workout);
        }
    });
}
function get_all_false(email,workout,array,callback){
    var list = []
    conn.query('SELECT workout,date FROM ($1) WHERE "completed"=($2)',[email,false])
    .on('data',function(row){
        var obj = new Object()
        obj.date = row.date;
        obj.workout = row.workout;
        var full = workout.slice(0,workout.indexOf("-"));
        conn.query('SELECT cycle,day FROM ($1) WHERE "workout"=($2)',[full,row.workout])
        .on('data',function(row){
            obj.string = getRealDate(obj.date)+ " Cycle:"+row.cycle.toString()+", Day:"+row.day.toString();
        })
        .on('end',function(){
            list.push(obj);
        });
    })
    .on('end',function(){
        callback(email,workout,array,list);
    });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////EXERCISES/////////////////////////////////////////////
function get_all_exercises(groups,workouts,callback){
    var exercises = [];
    conn.query('SELECT exercise FROM exercises')
    .on('data',function(row){
        exercises.push(row.exercise.split('_').join(' '));
    })
    .on('end',function(){
        callback(groups,workouts,exercises);
    });
}
function get_exercise_url(exercise){
    var url;
    conn.query('SELECT url FROM exercises WHERE "exercise"=($1)', [exercise])
    .on('data',function(row){
        url = row.url;
    })
    .on('end',function(){
        return url;
    });
}
function new_exercise(name,url,callback){
    conn.query('INSERT INTO exercises (exercise,url) VALUES ($1,$2)', [name,url]) //if the exercise does not exist already?
    .on('error', function(){
        return;
    });
    conn.query('ALTER TABLE users ADD '+name+' FLOAT');
    var users = getUserList();
    for(var i=0;i<users.length;i++){
        conn.query('ALTER TABLE ($1) ADD '+name+' FLOAT', [users[0].email]);
    }
    callback(name,url);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////GROUPS///////////////////////////////////////////////
function new_group(array, name,callback){
    conn.query('CREATE TABLE IF NOT EXISTS ($1) ("name" TEXT, "email" TEXT UNIQUE)',[name])
    .on('error',function(){
        return;
    })
    .on('end',function(){
        conn.query('INSERT INTO groups (group) VALUES ($1)', [name])
        .on('end',function(){
            for(var i =0;i<array.length;i++){
                conn.query('INSERT INTO ($1) (name,email) VALUES ($2,$3)',[name,array[i].name,array[i].email]);
            }
            conn.query('CREATE TABLE ($1) ("full" TEXT)',[name+"-assigned"])
            .on('end',function(){
                callback(name);
            });
        });
    });
}
function assign_full_workout(group,full){
    get_assigned_gro_1(full,[group,full],function(assigned,list){
        var x =0;
        for(var i=0,i<assigned.length;i++){
            if(assigned[i] == list[0]){
                var x=1;
                break;
            }
        }
        if(x=0){
            conn.query('INSERT INTO ($1) (group) VALUES ($2)',[list[1].toString() +"-groups",list[0]]);
            conn.query('INSERT INTO ($1) (full) VALUES ($2)',[list[0].toString()+"-assigned",list[1]]);
            var date = new Date();
            var d = date.UTC()-172800000;
            conn.query('SELECT workout,date FROM ($1) WHERE "completed"=($2), "date">($3)',[list[1],true,d])
            .on('data',function(row){
                table_to_array_2(row.workout,"email",list[1],row.date,function(array,workout,a,b){
                    populate_table_init(array,workout,a,b);
                });
            });
        }
    });
}
function unassign_workout(group,full){
    var str = full.toString() +"-groups";
    var str2 = group.toString()+"-assigned";
    conn.query('DELETE FROM ($1) WHERE "group"=($2)',[str,group]);
    conn.query('DELETE FROM ($1) WHERE "full"=($2)',[str2,full]);
    var w;
    var e;
    conn.query('SELECT workout FROM ($1) WHERE "completed"=($2)',[full,true])
    .on('data',function(row){
        w = row.workout;
        conn.query('SELECT email FROM ($1) WHERE "completed"=($2)',[w,false])
        .on('data',function(row){
            e = row.email;
            conn.query('DELETE FROM ($1) WHERE "workout"=($2)',[e,w])
            .on('end',function(){
                conn.query('DELETE FROM ($1) WHERE "workout"=($2)',[w,e])
            });
        });
    });
;
function push_group(user,group){
    var date = new Date();
    var d = date.UTC()-172800000;
    conn.query('INSERT INTO ($1) (name,email) VALUES ($2,$3)',[group,user.name,user.email]);
    conn.query('SELECT full FROM ($1)',[group.toString()+"-assigned"])
    .on('data',function(row){
        conn.query('SELECT workout FROM ($1) WHERE "completed"=($2), "date">($3)',[row.full,true,d])
        .on('data',function(row){
            table_to_array_2(row.workout,email,user.name,user.email,function(array,workout,a,b){
                var setnum = array.length;
                insert_wo_row(a,b,setnum,row.workout,array);
            });
        });
    });
}
function pop_group(email,group){
    conn.query('DELETE FROM ($1) WHERE "email"=($2)',[group,email]);
    conn.query('SELECT full FROM ($1)',[group.toString()+"-assigned"])
    .on('data',function(row){
        conn.query('SELECT workout FROM ($1) WHERE "completed"=($2)',[row.full,true])
        .on('data',function(row){
            conn.query('DELETE FROM ($1) WHERE "workout"=($2),"completed"=($3)',[email,row.workout,false]);
            conn.query('DELETE FROM ($1) WHERE "email"=($2),"completed"=($3)',[row.workout,email,false]);
        });
    });
}
function get_all_groups(callback){
    var list = [];
    conn.query('SELECT group FROM groups')
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        callback(list);
    });
}
function get_group(group,callback){
    var list = [];
    conn.query('SELECT name,email FROM ($1)',[group])
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        callback(list);
    });
}
}
function get_assigned_gro(workout,callback){
    var list = [];
    conn.query('SELECT group FROM ($1)',[workout+ "-groups"])
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        callback(list);
    });
}
function get_assigned_gro_1(workout,a,callback){
    var list = [];
    conn.query('SELECT group FROM ($1)',[workout+ "-groups"])
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        callback(list,a);
    });
}
function get_assigned_wo(group,callback){
    var list = [];
    conn.query('SELECT workout FROM ($1)',[group+ "-assigned"])
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        callback(list);
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////WORKOUT GENERATION//////////////////////////////////////
function create_fullworkout(cyclenum,cyclelen,name){
    conn.query('INSERT INTO workouts (cyclenum,cyclelen,name) VALUES ($1,$2)',[cyclenum,cyclelen,name])
    .on('end',function(){
        socket.emit("newFullWorkout", name);
        var full;
        conn.query('SELECT ident FROM workouts WHERE "cyclenum"=($1),"cyclelen"=($2),"name"=($3)',[cyclenum,cyclelen,name])
        .on('data',function(row){
            full = row.ident;
        })
        .on('end', function(){
            conn.query('CREATE TABLE ($1) ("group" TEXT)',[full.toString() + "-groups"]);
            create_blank_full_workout(full,cyclenum,cyclelen)
        });
    })
    .on('error',function(){
        console.log("youse a dummy");
    });
}
function create_blank_full_workout(full,cyclenum,cyclelen){
    conn.query('CREATE TABLE ($1) ("cycle" INTEGER, "day" INTEGER, "workout" TEXT, "date" INTEGER, "skip" BOOL)',[full])
    .on('end', function(){
        for(var i=0;i<cyclenum;i++){
            for(var j=0;j<cyclelen;j++){
                conn.query('INSERT INTO ($1) (cycle,day,skip) VALUES ($2,$3,$4)',[full,i,j,true]);
            }
        }
    });
}
function create_workout(array, date, cycle, day, full,callback){
    create_wo_name(array, date,cycle,day,full,function(array,workout,date,cycle,day,full,callback){
        array_to_table_init(array,workout,date,cycle,day,full,function(array,workout,date,cycle,day,full){
            populate_table_init_2(array,workout,date,cycle,day,full,function(array,workout,date,cycle,day,full){
                conn.query('UPDATE ($1) SET "date"=($2),"skip"=($3),"workout"=($4) WHERE "cycle"=($5),"day"=($6)',[full,date,false,workout,cycle,day]);
                callback(workout);
            });
        });
    });
}
function create_wo_name(array, date,cycle,day,full,callback){
    var workout = full.toString()+'-'+(Math.floor(Math.random()*100000000)).toString();
    conn.query('CREATE TABLE IF NOT EXISTS ($1) ("email" TEXT, "name" TEXT,"date" INTEGER, "completed" BOOL, "sets" INTEGER) ', [workout_name])
    .on('error',function(){
        create_wo_name(array, date,cycle,day,full,callback);
    })
    .on('end',function(){
        callback(array,date,cycle,day,full,callback);
    });
}
function populate_table_init(array,table,full,date){
    conn.query('SELECT group FROM ($1)',[full.toString() + "-groups"])
    .on("data",function(row){
        conn.query('SELECT name,email FROM ($1)',[row.group])
        .on('data',function(row){
            insert_wo_row(row.name,row.email,array.length,table,array,date);
        });
    })
    .on('end', function(){
        insert_wo_row("name","email",array.length,table,array,date);
    });
}
function populate_table_init_2(array,table,date,cycle,day,full,callback){
    conn.query('SELECT group FROM ($1)',[full.toString() + "-groups"])
    .on("data",function(row){
        conn.query('SELECT name,email FROM ($1)',[row.group])
        .on('data',function(row){
            insert_wo_row(row.name,row.email,array.length,table,array,date);
        });
    })
    .on('end', function(){
        insert_wo_row("name","email",array.length,table,array,date);
        callback(array,workout,date,cycle,day,full);
    });
}
function insert_wo_row(name,email,setnum,table,array,date){
    conn.query('SELECT email FROM ($1)',[table])
    .on('data',function(row){
        if(row.email == email){
            return;
        }
    })
    .on('end',function(){
        conn.query('INSERT INTO ($1) (email,name,completed,sets,date) VALUES ($2,$3,$4,$5,$6)',[table,email,name,false,setnum,date])
        .on('end',function(){
            populate_table_full(array,table,setnum,email);
            if(email != "email"){
                conn.query('INSERT INTO ($1) (workout,completed,skipped,date) VALUES ($2,$3,$4,$5)',[email,workout,false,false,date]);
            }
        });
    });
}
function delete_workout(workout){
    var full = workout.slice(0,workout.indexOf("-"));
    conn.query('UPDATE ($1) SET "completed"=($2) WHERE "workout"=($3)',[full,false,workout]);
    conn.query('DELETE FROM ($1) WHERE "completed"=($2)',[workout,false]);
    get_assigned_gro_1(full,workout,function(list,a){
        for(var i=0;i<list.length;i++){
            get_group(list[i],function(list){
                for(var j=0;j<list.length;j++){
                    conn.query('DELETE FROM ($1) WHERE "completed"=($2),"workout"=($3)',[list2[j].email,false,workout]);
                }
            });
        }
    });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////DATA CONVERSION FUNCTIONS//////////////////////////////////////////////
function array_to_table_init(array,workout,date,cycle,day,full,callback){
    var setnum = array.length;
    for(var i=0;i<setnum;i++){
        var num = i+1
        var setnumstr = num.toString();
        create_column(table,setnumstr,"BOOL");
        var exericses = array[i].exercises;
        var setlen = setnumstr + "-length";
        create_column(table,setlen,"INTEGER")
        for(var j=0;j<exercises.length;j++){
            var num2 = j+1;
            var exnumstr = setnumstr + "-" + num2.toString();
            create_column(table,exnumstr,"BOOL");
            var name = exercises[j].name.split(' ').join('_');
            var namestr = exnumstr + "#" + name;
            create_column(table,namestr, "TEXT");
            var rounds = exercises[j].rounds;
            var roundlenstr = exnumstr + "-length";
            create_column(table,roundlenstr,"INTEGER");
            for(var k=0;k<rounds.length;k++){
                var num3 = k+1;
                var repsstr = exnumstr + "-"+ num3.toString();
                var repnum= repsstr+"-reps";
                var weight= repstr+"-weight";
                create_column(table,repsstr,"BOOL");
                create_column(table,repnum,"INTEGER");
                create_column(table,weight,"INTEGER");

            }
        }
    }
}
function populate_table_full(array,table,setnum,email){
    for(var i=0;i<setnum;i++){
        var s = i+1;
        var setstr = s.toString();
        update_col(table,setstr,true,"email",email);
        var exercises = array[i].exercises;
        var setlenstr = setstr+ '-length';
        update_col(table,setlenstr,exercises.length,"email",email);
        for(var j=0;j<exercises.length;j++){
            var ex = j+1;
            var exstr = setstr +"-" +ex.toString();
            update_col(table,exstr,true,"email",email);
            var name = exercises[j].name.split(' ').join('_');
            var namestr = exnumstr + "#" + name;
            update_col(table,namestr,name,"email",email);
            var rounds = exercises[j].rounds;
            var rls = exnumstr + "-length";
            update_col(table,rls,rounds.length,"email",email);
            var reparray = [];
            for(var k=0;k<rounds.length;k++){
                var num3 = k+1;
                var rds = exstr + "-"+ num3.toString();
                var rs= rds+"-reps";
                var ws= rds+"-weight";
                var r= rounds[k].reps;
                var weightval = 0;
                if(email != "email"){
                    weightval= rounder(get_weight(r,(get_old_max(email,name))),5);
                }
                update_col(table,ws,w,"email",email);
                update_col(table,rds,true,"email",email);
                update_col(table,rs,r,"email",email);
            }
        }
    }
}
function table_to_array(workout,email,callback){
    var array = [];
    conn.query('SELECT * FROM ($1) WHERE email=($2)',[workout,email])
    .on('data',function(row){
        var keys = Object.keys(row);
        var values = Object.values(row);
        var sets = row.sets;
        for (var i = 1; i <= sets; i++) {
            var exlenstr=i.toString()+"-length"; 
            var exlen = values[keys.indexOf(exlenstr)];
            var newset = new Object();
            newset.completed == true;
            newset.exercises == {};
            for(var j=1;j<=exlen;j++){
                var exstr = set.toString()+"-"+j.toString();
                var rdlenstr = exstr+"-length";
                var rdlen = values[keys.indexOf(rdlenstr)];
                var newex = new Object();
                newex.completed = true;
                var s = exstr+"#";
                var len = s.length;
                for(var k=0;k<keys.length;k++){
                    if(keys[k].slice(0,len) == s){
                        newex.name = keys[k].slice(len).split('_').join(' ');
                        break;
                    }
                }
                newex.rounds = {};
                for(var l=1;l<=rdlen;l++){
                    var round = new Object();
                    round.completed = true;
                    var rdstr = exstr+"-"+l.toString();
                    var ws = exstr + "-weight";
                    var rs = exstr + "-reps";
                    var w = values[keys.indexOf(ws)];
                    var r = values[keys.indexOf(rs)];
                    round.weight = w;
                    round.reps = r;
                    newex.rounds.push(round);
                }
                newset.exercises.push(newex);
            }
            array.push(newset);
        }
    })
    .on('end',function(){
        callback(array);
    });
}
function table_to_array_2(workout,email,a,b,callback){
    var array = [];
    conn.query('SELECT * FROM ($1) WHERE email=($2)',[workout,email])
    .on('data',function(row){
        var keys = Object.keys(row);
        var values = Object.values(row);
        var sets = row.sets;
        for (var i = 1; i <= sets; i++) {
            var exlenstr=i.toString()+"-length"; 
            var exlen = values[keys.indexOf(exlenstr)];
            var newset = new Object();
            newset.completed == true;
            newset.exercises == {};
            for(var j=1;j<=exlen;j++){
                var exstr = set.toString()+"-"+j.toString();
                var rdlenstr = exstr+"-length";
                var rdlen = values[keys.indexOf(rdlenstr)];
                var newex = new Object();
                newex.completed = true;
                var s = exstr+"#";
                var len = s.length;               
                for(var k=0;k<keys.length;k++){
                    if(keys[k].slice(0,len) == s){
                        newex.name = keys[k].slice(len).split('_').join(' ');
                        break;
                    }
                }
                newex.rounds = {};
                for(var l=1;l<=rdlen;l++){
                    var round = new Object();
                    round.completed = true;
                    var rdstr = exstr+"-"+l.toString();
                    var ws = exstr + "-weight";
                    var rs = exstr + "-reps";
                    var w = values[keys.indexOf(ws)];
                    var r = values[keys.indexOf(rs)];
                    round.weight = w;
                    round.reps = r;
                    newex.rounds.push(round);
                }
                newset.exercises.push(newex);
            }
            array.push(newset);
        }
    })
    .on('error',function(){
        callback(array,workout,a,b);
    })
    .on('end',function(){
        callback(array,workout,a,b);
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////SUBMISSION FUNCTIONS////////////////////////////////////////////
function submit_workout(email,workout,date){
    conn.query('UPDATE ($1) SET "completed"=($2),"date"=($3) WHERE "email"=($4)',[workout,true,date,email]);
    conn.query('UPDATE ($1) SET "completed"=($2),"date"=($3) WHERE "workout"=($4)',[email,true,date,workout])
    .on('end',function(){
        get_wo_val(workout, "sets",email,{},function(workout,column,email,list,val){
            for(var i=1;i<=val;i++){
                get_wo_val(workout,i.toString(),email,{},function(workout,column,email,list,val){
                    if(val == true){
                        submit_set(email,workout,column);
                    }
                });
            }
        });
    });
}
function submit_set(email,workout,str){
    get_wo_val(workout,str+"-length",email,{},function(workout,column,email,list,val){
        for(var j=1;j<=val;j++){
            get_wo_val(workout,str+"-"+j.toString(),email,{},function(workout,column,email,list,val){
                if(val == true){
                    submit_ex(email,workout,column);
                }
            });
        }
    });
}
function unsubmit_set(email,workout,str){
    get_wo_val(workout,str+"-length",email,{},function(workout,column,email,list,val){
        for(var j=1;j<=val;j++){
            get_wo_val(workout,str+"-"+j.toString(),email,{},function(workout,column,email,list,val){
                if(val == true){
                    unsubmit_ex(email,workout,str+"-"+j.toString());
                }
            });
        }
    });
}
function unsubmmit_ex(email,workout,str){
    get_name_from_key(email,workout,str,function(email,workout,str,name){
        var stry = 'UPDATE ($1) SET ' + name +  '= ($2) WHERE ($3) = ($4)';
        conn.query(stry,[email,null,"workout",workout])
        .on('end', function(){
            latest(email,workout,name,null,function(email,workout,name,max,bool){
                if(bool){
                    other_latest(email,workout,name,function(email,name,max){
                        update_col("users",name,max,"email",email);
                        update_all_workouts(email,name);
                    });
                }
            });
        });
    });
}
function submmit_ex(email,workout,str){
    get_name_from_key(email,workout,str,function(email,workout,str,name){
        get_max_from_lift(email,workout,str,function(email,workout,str,val){
            if(val != NaN){
                var stry = 'UPDATE ($1) SET ' + str +  '= ($2) WHERE ($3) = ($4)';
                conn.query(stry,[email,val,"workout",workout])
                .on('end', function(){
                    latest(email,workout,str,val,function(email,workout,name,max,bool){
                        if(bool){
                            update_col("users",name,max,"email",email);
                            update_all_workouts(email,name);
                        }
                    });
                });
            }
        });
    });
}
function update_all_workouts(email,name){
    conn.query("SELECT workout FROM ($1) WHERE 'completed'=false,'skipped'=false",[email])
    .on('data',function(row){
        var wo = row.workout;
        conn.query("SELECT * FROM ($1) WHERE 'email'=($2)",[wo,email])
        .on('data',function(row){
            var keys = Object.keys(row);
            var values = Object.values(row);
            var namelen = name.length;
            for(var k=0;k<keys.length;k++){
                if(keys[k].slice(-namelen) == name){
                    var col = keys[k];
                    var str1 = col.slice(0,col.length-namelen-1);
                     var strlen = str1 + "-1-reps";
                    get_wo_val(wo,strlen,email,[str1,name],function(workout,column,email,list,val){
                        var weightval = 0;
                        if(email != "email"){
                            weightval= rounder(get_weight(val,(get_old_max(email,list[1]))),5);
                        }
                        get_wo_val(workout,list[0]+'-length',email,[weightval,list[0]],function(workout,column,email,list,val){
                            for(var i=0;i<val;i++){
                                var x = i+1;
                                var y = 'UPDATE ($1) SET '+list[1]+"-"+x.toString()+"-weight"+'=($3) WHERE "email"=($4)'
                                conn.query(y,[workout,list[0], email]);
                            }
                        });
                    });
                    break;
                }
            }
        });
    });
}
function update_workout(str, value, completed, user, workout){
    var stry = 'UPDATE ($1) SET ' + str +  '= ($2) WHERE ($3) = ($4)';
    conn.query(stry,[workout,value,"email",user])
    .on('end',function(){
        if(completed == true){
            var dashes = str.split("-").length-1;
            if(dashes == 0){
                if(value == true){
                    submit_set(user,workout,str);
                }
                else if(value == false){
                    unsubmit_set(user,workout,str);
                }
                return;
            }
            else if(dashes == 1){
                if(value == true){
                    submit_ex(user,workout,list.str);
                }
                else if(value == false){
                    unsubmit_ex(user,workout,list.str);
                }
                return;
            }
            else if(dashes == 2 || dashes == 3){
                submit_ex(user,workout,(str.split("-")[0]+"-"+str.split("-")[1]));
            }
        }
    });
}
function change_date(workout,date){
    var full = workout.split("-")[0];
    var groups = [];
    conn.query('SELECT group FROM ($1)',[workout+ "-groups"])
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        var users =[];
        for(var i=0;i<groups.length();i++){
            var list = [];
            conn.query('SELECT name,email FROM ($1)',[group])
            .on('data',function(row){
                list.push(row);
            })
            .on('end',function(){
                for(var j=0;j<l.length();j++){
                    users.push(l[j].email);
                    conn.query('SELECT date FROM ($1) WHERE "workout"=($2)',[users[0],workout])
                    .on('data',function(row){
                        if(row.date > date){
                            for(var i=0;i<users.length();i++){
                                conn.query('UPDATE ($1) SET "date"=($2) WHERE "workout"=($3)',[users[i],date,workout]);
                            }
                        }
                        else if(row.date < date){
                            for(var i=0;i<users.length();i++){
                                conn.query('UPDATE ($1) SET "date"=($2),"skipped"=($3) WHERE "workout"=($4)',[users[i],date,true,workout]);
                            }
                        }
                    });
                }
            });
        }
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////DATABASE HELPER FUNCTIONS//////////////////////////////////////
function other_latest(email,workout,name,callback){
    var date =0;
    var max=0;
    conn.query('SELECT workout,($1),date FROM ($2) WHERE "completed"=($3)',[name,email,true])
    .on('data',function(row){
        if(row.workout != workout && row.date > date){
            max = Object.values(row)[1];
            date = row.date;
        }
    })
    .on('end',function(){
        callback(email,name,max);
    });
}
function latest(email,workout,name,max,callback){
    var latest;
    var date=0;
    var val;
    var bool;
    conn.query('SELECT workout,($1),date FROM ($2) WHERE completed=($3)',[name,email,true])
    .on('data',function(row){
        val = Object.values(row)[1];
        if(row.date > date && val != null){
            latest = row.workout;
            date = row.date;
        }
    })
    .on('end',function(){
        if(latest == workout){
            bool =true;
            callback(email,workout,name,max,bool);
        }
        else{
            bool = false;
            callback(email,workout,name,max,bool);
        }
    });
}
function get_wo_val(workout,column,email,list,callback){
    conn.query('SELECT ($1) FROM ($2) where "email"=($3)',[column,workout,email])
    .on('data',function(row){
        var val = Object.values(row)[0];
        callback(workout,column,email,list,val);
    });
}
function get_name_from_key(email,workout,str,callback){
    var s = str+"#";
    var len = s.length;
    var name;
    conn.query('SELECT * FROM ($1) WHERE "email"=($2)',[workout,email])
    .on("data",function(row){
        var cols = Object.keys(row);
        for(var k=0;k<cols.length;k++){
            if(cols[k].slice(0,len) == s){
                name = cols[k].slice(len);
                callback(email,workout,str,name);
                break;
            }
        }
    });
}
function create_column(table,column,type){
    var str = 'ALTER TABLE ($1) ADD '+column+' ($2)';
    conn.query(str,[table,type]);
}
function update_col(table,column,value,cona,conb){
    var str = 'UPDATE ($1) SET ' + column +  '= ($2) WHERE ($3) = ($4)';
    conn.query(str,[table,value,cona,conb]);
}
function get_all_full(groups,callback){
    list = [];
    conn.query('SELECT workout,ident,cyclenum,cyclelen FROM workouts')
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        callback(groups,list);
    })
}
function wo_in_full(full,callback){
    list = [];
    conn.query('SELECT cycle,day,workout,skip FROM ($1)',[full])
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        callback(list);
    });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////WEIGHTLIFTING MATH CALCULATIONS////////////////////////////
function get_max_from_lift(email,workout,str,callback){
    get_wo_val(workout,str+"-length",email,{str:str},function(workout,column,email,list,val){
        var total =0;
        var exlen = val;
        var value;
        for(var l=1;l<=exlen;l++){
            var rds = list.str+"-"+l.toString();
            total += get_wo_val(workout,rds + "-weight",email,{str:str},function(workout,column,email,list,val){
                return get_wo_val(workout,rds + "-reps",email,{str:str,weight:val},function(workout,column,email,list,val){
                    return get_new_max(val,list.weight);
                });
            });
        }
        value = math.floor(total/exlen);
        callback(email,workout,list.str,value);
    });
}
function get_old_max(user, exercise){
    var weight =0;
    conn.query('SELECT ($1) FROM users WHERE "email"=($2)',[exercise,user])
    .on('data',function(row){
        if(weight != null && weight != 0){
            weight = Object.values(row)[0];
        }
    })
    .on('end',function(){
        return weight;
    });
}
function get_new_max(reps,weight){
    return math.floor((weight)/(1.013-(0.0267123*reps)));
}
function get_weight(reps,max){
    return ((1.013-(0.0267123*reps))*max);
}
function rounder(num,diff){
    return (math.floor(((num+(diff/2))/diff))*diff)
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////Check Progress Data Grabber Functions////////////////////////////
function get_user_data(email,callback){
    array = [];
    conn.query('SELECT * FROM ($1) WHERE "completed"=($2),"skipped"=($3)',[email,true,true])
    .on('data',function(row){
        array.push(row);
    })
    .on('end',function(){
        var obj = {email:email, array:array};
        conn.query('SELECT name FROM users WHERE "email"=($1)',[email])
        .on('data',function(row){
            obj.name = name;
        })
        .on('end',function(){
            callback(obj);
        });
    });
}
function get_group_data(group){
    get_group(group,function(list){
        var array = [];
        for(var i=0;i<list.length;i++){
            array.push(get_user_data(list[i].email,function(obj){return obj;}))
        }
        callback({groupname:group, data:array});
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////