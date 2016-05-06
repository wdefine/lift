/*TODO LIST
2. make editing workout possible!
3. start writing mustahce files!
7. Make asynchronous adjustments!!!
7a) is the tree in newUser correct? 
7b) do .then functions need parameters? -i hope not
7c) will the encrypt function fuck me over in data conversion functions?
7d) in submit_workout function embedded in if statement? -what about pushing functions to arrays?
7e) do i even need q for .then functions?
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
        var array = table_to_array(workout,email);
        array.then(function(){
            socket.emit('nextWorkout',array);
        });
    });
    socket.on('getGroupWorkouts',function(group){ //admin
        var wolist = get_assigned_wo(group);
        wolist.then(function(){
            socket.emit('groupWorkouts',wolist);
        });
    });
    socket.on('getWorkoutGroups',function(workout){ //admin
        var grolist = get_assigned_gro(workout);
        grolist.then(function(){
            socket.emit('workoutGroups',grolist);
        });
    });
    socket.on('getGroupUsers',function(group){ //admin
        var ulist = get_group(group);
        ulist.then(function(){
            socket.emit('groupUsers',ulist);
        });
    });
    socket.on('submitMax',function(email,exercise,max){ //all
        update_col("users",encrypt(exercise),max,"email",email);
    });
    socket.on('changeWorkout',function(email,workout,set,exercise,type,value,completed){ //all 
        update_workout(set.toString()+"-"+exercise.toString()+"-"+type,value,completed,email,workout);
    });
    socket.on('submitWorkout',function(email,workout,date){ //all
        submit_workout(email,workout,date);
    });
    socket.on('createExercise',function(name,url){ //admin
        var name = encrypt(name);
        var success = name.then(function(){
            new_exercise(name,url)
        });
        success.then(function(){
            if(success != null){
                socket.emit('newExercise',success);
            }
        });
    });
    socket.on('editExerciseUrl',function(name,url){ //admin
        update_col("exercises","url",url,"name",encrypt(name));
    });
    socket.on('createGroup',function(name,array){ //admin
        var success = new_group(array,name);
        success.then(function(){
            if(success != null){
                socket.emit('newGroup',success);
            }
        });
    });
    socket.on('editGroupadd',function(name,user){ //admin
        push_group(user,name);
    });
    socket.on('editGroupdelete',function(name,user){ //admin
        pop_group(user,name);
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
        create_workout(array,date,cycle,day,full);
        create_workout.then(function(){
            update_col(workout,"completed",true,"email","email");
        });
    });
    socket.on('deleteWorkout',function(workout){ //admin
        delete_workout(workout);
    });
    socket.on('getFullWorkout',function(full){ //admin
        var list = wo_in_full(full);
        list.then(function(){
            socket.emit('fullWorkout',list);
        });
    });
    socket.on('getBlankWorkout'function(workout){ //admin
        var array = table_to_array(workout,"email");
        array.then(function(){
            socket.emit('blankWorkout',array);
        });
    });
    socket.on('createUser',function(name,email){ //admin
        var success = new_user(name,email);
        if(success != null){
            socket.emit('newUser',success)
        }
    });
    socket.on('getGroupExerciseData',function(group){ //admin
        var array = get_group_data(group);
        array.then(function(){
            socket.emit('groupExerciseData',array);
        });
    });
    socket.on('getUserData',function(email){ //all
        var object = get_user_data(email);
        object.then(function(){
            socket.emit('userData',object);
        });
    });
});
function get_email(req){
    conn.query('SELECT email FROM backfill WHERE "digits"=($1)',[req])
    .on('data',function(row){
        return row.email;
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
    var email = get_email(request.user);
    if(email == admin){
        //respond with create workout page
        var groups = get_all_groups();//done
        var workouts = get_all_full(); //done
        var exercises = get_all_exercises();//done
        var users = get_all_users();//done
        response.render('create-workout.html',/*mustache in above data*/);
    }
    else if(email == user){
        //respond with next workout
        var workout = get_next_wo(email);
        var allworkouts = get_all_false(email);
        response.render('workout.html',/*mustahce in workout and allworkouts*/);
    }
    else{
        //respond with create account page ---we will direct them to ask o'donnell for access
        response.render('request-account.html');
    }
});
app.get('/progress', function(request, response){
    var email = get_email(request.user);
    if(email == admin){
        var groups = get_all_groups();
        var workouts = get_all_full();
        var exercises = get_all_exercises();
        var users = get_all_users();
        response.render('school-progress.html',/*mustache in above data*/);
    }
    else if(email == user){
        var data = get_all_userdata(email);
        var exercises = get_all_exercises();
        response.render('user-progress.html',/*mustache in above data*/);
    }
    else{
        //respond with create account page ---we will direct them to ask o'donnell for access
        response.render('request-account.html');
    }    
});
server.listen(8080);
///////////////////////////////////////////////////////////CONVERSION FUNCTIONS////////////////////////////////
function encrypt(string){
    return string.split(' ').join('_');
}
function decrypt(string){
    return string.split('_').join(' ');
}
function getRealDate(number){
    var d = new Date(number);
    var date = d.toJSON().substring(0,10);
    return date; 
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////USERS////////////////////////////////////////////////
function new_user(name,email){
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
            var exercises = get_all_exercises();
            exercises
                .then(function(){
                    for(var i = 0;i<exercises.length;i++){
                        conn.query('ALTER TABLE ($1) ADD '+exercises[0]+' FLOAT',[email]);
                    }
                })
                .then(function(){
                    return {name:name, email:email};
                });
        });
    });
}
function get_all_users(){
    var users = [];
    conn.query('SELECT name FROM users')
    .on('data',function(row){
        var user = {name:row.name, email:row.email}
        users.push(user);
    })
    .on('end',function(){
        return users;
    });
}
function get_next_wo(email){
    //////////////////////////////////get todays date
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
            return [];
        }
        else{
            return table_to_array(workout,email);
        }
    });
}
function get_all_false(email){
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
        .on('end'function(){
            list.push(obj);
        })
    })
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////EXERCISES/////////////////////////////////////////////
function get_all_exercises(){
    var exercises = [];
    conn.query('SELECT exercise FROM exercises')
    .on('data',function(row){
        exercises.push(decrypt(row.exercise);
    })
    .on('end',function(){
        return exercises;
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
function new_exercise(name,url){
    conn.query('INSERT INTO exercises (exercise,url) VALUES ($1,$2)', [name,url]) //if the exercise does not exist already?
    .on('error', function(){
        return null;
    });
    conn.query('ALTER TABLE users ADD '+name+' FLOAT');
    var users = getUserList();
    for(var i=0;i<users.length;i++){
        conn.query('ALTER TABLE ($1) ADD '+name' FLOAT', [users[0].email]);
    }
    return name;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////GROUPS///////////////////////////////////////////////
function new_group(array, name){
    conn.query('CREATE TABLE IF NOT EXISTS ($1) ("name" TEXT, "email" TEXT)',[name])
    .on('error',function(){
        return null;
    })
    .on('end',function(){
        conn.query('INSERT INTO groups (group) VALUES ($1)', [name])
        .on('end',function(){
            for(var i =0;i<array.length;i++){
                conn.query('INSERT INTO ($1) (name,email) VALUES ($2,$3)',[name,array[i].name,array[i].email]);
            }
            conn.query('CREATE TABLE ($1) ("full" TEXT)',[name+"-assigned"])
            .on('end',function(){
                return name;
            });
        });
    });
}
function assign_full_workout(group,full){
    conn.query('INSERT INTO ($1) (group) VALUES ($2)',[full.toString() +"-groups",group]);
    conn.query('INSERT INTO ($1) (full) VALUES ($2)',[group.toString()+"-assigned",full]);
    var date = new Date();
    var d = date.UTC()-172800000;
    d.then(function(){
        conn.query('SELECT workout,date FROM ($1) WHERE "completed"=($2), "date">($3)',[full,true,d])
        .on('data',function(row){
            var array = table_to_array(row.workout,"email");
            array.then(function(){
                populate_table_init(array,row.workout,full,row.date);
            });
        });
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
}
function push_group(user,group){
    var date = new Date();
    var d = date.UTC()-172800000;
    d.then(function(){
        conn.query('INSERT INTO ($1) (name,email) VALUES ($2,$3)',[group,user.name,user.email]);
        conn.query('SELECT full FROM ($1)',[group.toString()+"-assigned"])
        .on('data',function(row){
            conn.query('SELECT workout FROM ($1) WHERE "completed"=($2), "date">($3)',[row.full,true,d])
            .on('data',function(row){
                var array = table_to_array(row.workout,email);
                .then(function(){
                    var setnum = array.length;
                })
                .then(function(){
                    insert_wo_row(user.name,user.email,setnum,row.workout,array);
                });
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
function get_all_groups(){
    var list = [];
    conn.query('SELECT group FROM groups')
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        return list;
    });
}
function get_group(group){
    var list = [];
    conn.query('SELECT name,email FROM ($1)',[group])
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        return list;
    });
}
}
function get_assigned_gro(workout){
    var list = [];
    conn.query('SELECT group FROM ($1)',[workout+ "-groups"])
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        return list;
    });
}
function get_assigned_wo(group){
    var list = [];
    conn.query('SELECT workout FROM ($1)',[group+ "-assigned"])
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        return list;
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////WORKOUT GENERATION//////////////////////////////////////
function create_fullworkout(cyclenum,cyclelen,name){
    conn.query('INSERT INTO workouts (cyclenum,cyclelen,name) VALUES ($1,$2)',[cyclenum,cyclelen,name])
    .on('end',function(){
        var full;
        conn.query('SELECT ident FROM workouts WHERE "cyclenum"=($1),"cyclelen"=($2),"name"=($3)',[cyclenum,cyclelen,name])
        .on('data',function(row){
            full = row.ident;
        })
        .on('end', function(){
            conn.query('CREATE TABLE ($1) ("group" TEXT)',[full.toString() + "-groups"]);
            create_blank_full_workout(full,cyclenum,cyclelen)
        });
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
function create_workout(array, date, cycle, day, full){
    var workout = create_wo_name(array,full);
    workout
    .then(function(){
        array_to_table_init(array,workout_name,full,date);
    })
    .then(function(){
        populate_table_init(array, table,full);
    })
    .then(function(){
        conn.query('UPDATE ($1) SET date=($2),skip=($3),workout=($4) WHERE "cycle"=($5),"day"=($6)',[full,date,false,workout,cycle,day]);
    })
    .then(function(){
        return workout;
    });
}
function create_wo_name(array, full){
    var workout_name = full.toString()+'-'+(Math.floor(Math.random()*100000000)).toString();
    conn.query('CREATE TABLE IF NOT EXISTS ($1) ("email" TEXT, "name" TEXT,"date" INTEGER, "completed" BOOL, "sets" INTEGER) ', [workout_name])
    .on('error',function(){
        create_wo_name(array,full);
    })
    .on('end',function(){
        return workout_name;
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
    .on('end'function(){
        insert_wo_row("name","email",array.length,table,array,date);
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
    var list = get_assigned_gro(full);
    list.then(function(){
        for(var i=0;i<list.length;i++){
            var list2 = get_group(list[i]);
            list2.then(function(){
                for(var j=0;j<list.length;j++){
                    conn.query('DELETE FROM ($1) WHERE "completed"=($2),"workout"=($3)',[list2[j].email,false,workout]);
                }
            });
        }
    });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////DATA CONVERSION FUNCTIONS//////////////////////////////////////////////
function array_to_table_init(array, table,full,date){
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
            var name = encrypt(exercises[j].name);
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
        update_col(table,setstr,false,"email",email);
        var exercises = array[i].exercises;
        var setlenstr = setstr+ '-length';
        update_col(table,setlenstr,exercises.length,"email",email);
        for(var j=0;j<exercises.length;j++){
            var ex = j+1;
            var exstr = setstr +"-" +ex.toString();
            update_col(table,exstr,true,"email",email);
            var name = encrypt(exercises[j].name);
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
                var weightval= rounder(get_weight(r,(get_old_max(email,name))),5);
                update_col(table,ws,w,"email",email);
                update_col(table,rds,true,"email",email);
                update_col(table,rs,r,"email",email);
            }
        }
    }
}
function table_to_array(workout,email){
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
            newset[i] == false;
            newset.exercises == {};
            for(var j=1;j<=exlen;j++){
                var exstr = set.toString()+"-"+j.toString();
                var rdlenstr = exstr+"-length";
                var rdlen = values[keys.indexOf(rdlenstr)];
                var newex = new Object();
                newex[j] = true;
                var name = decrypt(get_name_from_key(email,workout,extstr));
                newex.rounds = {};
                for(var l=1;l<=rdlen;l++){
                    var round = new Object();
                    round[l] = true;
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
        return array;
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////SUBMISSION FUNCTIONS////////////////////////////////////////////
function submit_workout(email,workout,date){
    conn.query('UPDATE ($1) SET completed=($2),date=($3) WHERE "email"=($4)',[workout,true,date,email]);
    conn.query('UPDATE ($1) SET completed=($2),date=($3) WHERE "workout"=($4)',[email,true,date,workout])
    .on('end',function(){
        var sets = get_wo_val(workout, "sets",email);
        sets.then(function(){
            for(var i=1;i<=sets;i++){
                if(get_wo_val(workout,i.toString(),email)==true){
                    submit_set(email,workout,thissetstr);
                }
            }
        })
    });
}
function submit_set(email,workout,str){
    var exs = get_wo_val(workout,str+"-length",email);
    exs.then(function(){
        for(var j=1;j<=exs;j++){
            if(get_wo_val(workout,str+"-"+j.toString(),email)==true){
                submit_ex(email,workout,str+"-"+j.toString());
            }
        }
    });
}
function unsubmit_set(email,workout,str){
    var exs = get_wo_val(workout,str+"-length",email);
    exs.then(function(){
        for(var j=1;j<=exs;j++){
            if(get_wo_val(workout,str+"-"+j.toString(),email)==true){
                unsubmit_ex(email,workout,str+"-"+j.toString());
            }
        }
    });
}
function unsubmmit_ex(email,workout,str){
    var exname = get_name_from_key(email,workout,str);
    exname.then(function(){
        update_col(email,exname,null,"workout",workout);
        if(latest(email,workout,exname) == true){
            var max = other_latest(email,workout,exname);
            max.then(function(){
                update_col("users",exname,max,"email",email);
            });
        }
    });
}
function submmit_ex(email,workout,str){
    var exname = get_name_from_key(email,workout,str);
    exname
    .then(function(){
        var max= get_max_from_lift(email,workout,str);
    })
    .then(function(){
        if(max != NaN){
            update_col(email,exname,max,"workout",workout);
            if(latest(email,workout,exname) == true){
                update_col("users",exname,max,"email",email);
            }
        }
    });
}
function update_workout(str, value, completed, user, workout){ 
    update_col(workout,str,value,"email",user);
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
        else if(get_wo_val(workout,str.split("-")[0],user) == true){
            if(dashes == 1){
                if(value == true){
                    submit_ex(user,workout,str);
                }
                else if(value == false){
                    unsubmit_ex(user,workout,str);
                }
                return;
            }
            else if(get_wo_val(workout,(str.split("-")[0]+"-"+str.split("-")[1]),user) == true){
                if(dashes == 2){
                    submit_ex(user,workout,(str.split("-")[0]+"-"+str.split("-")[1]));
                    return;
                }
                else if(dashes == 3 && get_wo_val(workout,(str.split("-")[0]+"-"+str.split("-")[1]+"-"+str.split("-")[2]),user) == true){
                    submit_ex(user,workout,(str.split("-")[0]+"-"+str.split("-")[1]));
                }
            }
        }
    }
}
function change_date(workout,date){
    var full = workout.split("-")[0];
    var groups = get_assigned_gro(full);
    groups.then(function(){
        var users =[];
        for(var i=0;i<groups.length();i++){
            var l = get_group(groups[i]);
            l.then(function(){
                for(var j=0;j<l.length();j++){
                    users.push(l[j].email);
                }
            });
        }
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
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////DATABASE HELPER FUNCTIONS//////////////////////////////////////
function other_latest(email,workout,exname){
    var date;
    var max=0;
    conn.query('SELECT workout,($1),date FROM ($2) WHERE "completed"=($3)',[exname,email,true])
    .on('data',function(row){
        if(row.workout != workout && row.date > date){
            max = Object.values(row)[1];
        }
    })
    .on('end',function(){
        return max;
    })
}
function latest(email,workout,exname){
    var latest;
    var date=0;
    var val;
    conn.query('SELECT workout,($1),date FROM ($2) WHERE completed=($3)',[exname,email,true])
    .on('data',function(row){
        val = Object.values(row)[1];
        if(row.date > date && val != null){
            latest = row.workout;
        }
    })
    .on('end',function(){
        if(latest == workout){
            return true;
        }
        else{
            return false;
        }
    })
}
function get_wo_val(table,column,email){
    conn.query('SELECT ($1) FROM ($2) where "email"=($3)',[column,table,email])
    .on('data',function(row){
        var val = Object.values(row)[0];
        return val;
    });
}
function get_name_from_key(email,workout,str){
    var s = str+"#";
    var len = s.length;
    conn.query('SELECT * FROM ($1) WHERE "email"=($2)',[workout,email])
    .on("data",funcion(row){
        var cols = Object.keys(row);
        for(var k=0;k<cols.length;k++){
            if(cols[k].slice(0,len) == s){
                return cols[k].slice(len);
            }
        }
    })
}
function create_column(table,column,type){
    var str = 'ALTER TABLE ($1) ADD '+column+' ($2)';
    conn.query(str,[table,type]);
}
function update_col(table,column,value,cona,conb){
    var str = 'UPDATE ($1) SET ' + column +  '= ($2) WHERE ($3) = ($4)';
    conn.query(str,[table,value,cona,conb]);
}
function get_all_full(){
    list = [];
    conn.query('SELECT workout,ident,cyclenum,cyclelen FROM workouts')
    .on('data'function(row){
        list.push(row);
    })
    .on('end',function(){
        return list;
    })
}
function wo_in_full(full){
    list = [];
    conn.query('SELECT cycle,day,workout,day,skip FROM ($1)',[full])
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        return list;
    });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////WEIGHTLIFTING MATH CALCULATIONS////////////////////////////
function get_max_from_lift(email,workout,str){
    var total=0;
    var exlen = get_wo_val(workout,str+"-length",email);
    exlen.then(function(){
        for(var l=1;l<=exlen;l++){
            var rds = str+"-"+l.toString();
            var w = get_wo_val(workout,rds + "-weight",email);
            w.then(function(){
                var r = get_wo_val(workout,rds + "-reps",email);
            })
            w.then(function(){
                total += get_new_max(r,w);
            });
        }
        return math.floor(total/exlen);
    });
}
function get_old_max(user, exercise){
    var weight =0;
    conn.query('SELECT ($1) FROM users WHERE "email"=($2)',[exercise,user])
    .on('data',function(row){
        if(weight != null && weight != 0){
            weight = Object.values(row)[0];
        }
    });
    .on('end',function(){
        return weight;
    })
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
function get_user_data(email){
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
            return array;
        });
    });
}
function get_group_data(group){
    var array = [];
    var list = get_group(group);
    list
    .then(function(){
        for(var i=0;i<list.length;i++){
            array.push(get_user_data(list[i].email))
        }
        var obj = {groupname:group, data:array};
    })
    .then(function(){
        return obj;
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////