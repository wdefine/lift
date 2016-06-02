/*TODO LIST
2. make editing workout possible!
3. start writing mustahce files!
7. Make asynchronous adjustments!!!
7a) is get_max_from_list correct
7b) check over everything
updating excercise url doesnt put the info into the database.
line 689 what should happen with the inputs
what ever the fuck is happening with edit excercise url 1174
adding someone to a team puts an object in the name of group drop down


//////bug////////
if you add the same person to a group they are already in then server crashes.


*/

var http = require('http'); 
var express = require('express');
var app = express();
var server = http.createServer(app); 

var io = require('socket.io').listen(server);
var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://lift.db.sqlite');
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
            callbackURL: "http://localhost:8080/auth/google/callback"
        },
        function(token, refreshToken, profile, done) {
            var x = 0;
            if (profile._json.domain == 'stab.org' || profile._json.domain == 'students.stab.org') { 
                conn.query('SELECT * FROM backfill')
                .on('data',function(row){
                    if(row.email == profile._json.emails[0].value && row.digits == profile._json.id){
                        x=1;
                    }
                })
                .on('end',function(){
                    if(x==0){
                        var status = null;
                        conn.query('SELECT status FROM users WHERE "email"=($1)',[profile._json.emails[0].value])
                        .on('data',function(row){
                            status = row.status;
                        })
                        .on('end',function(){
                            if(status != null){
                                console.log(status, "the digits are" + profile._json.id);
                                conn.query('INSERT INTO backfill (email,digits,status) VALUES ($1,$2,$3)',[profile._json.emails[0].value,profile._json.id,status]);

                            }
                        });
                    }
                    done(null, profile);

                });
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
        successRedirect: '/', /* TODO: This is the name of the page you would like the user to go to once they are signed in */
        failureRedirect: '/auth/google'
    })(req, res);
});

app.get('/logout', function (req, res) {
    req.logOut();
    res.redirect('/login');
});
io.on('connection', function(socket) {
    socket.join("stab");
    socket.on('getNextWorkout',function(workout,email){ //all
        console.log("request received");
        console.log("email: "+email+" Workout: "+workout);
        table_to_array(workout,email, function(array){
            console.log(array);
            socket.emit('nextWorkout',array);
        });
    });
    socket.on('getGroups',function(){ //admin
        get_all_groups(function(list){socket.emit('groups',list);});
    });
    socket.on('getWorkouts',function(group){ //admin
        get_assigned_wo(group,function(list){
            console.log(list, "here are assigned gros");
            socket.emit('workouts',list);
        });
    });
    socket.on('getGroupUsers',function(group){ //admin
        get_group(group,function(list){socket.emit('groupUsers',list);});
    });
    socket.on('submitMax',function(email,exercise,max){ //all
        update_col("users",exercise.split(' ').join('_'),max,"email",email);
    });
    socket.on('changeWorkout',function(email,workout,str,value,completed){ //all
        console.log("cell value :" + value + " Cell Id: "+ "b"+str+ " completed: "+completed+" Workout name: "+workout +" email: "+email);
        update_workout("b"+str,value,completed,email,workout);
    });
    socket.on('submitWorkout',function(email,workout,date){ //all
        submit_workout(email,workout,date);
    });
    socket.on('createExercise',function(name,url){ //admin
        var name = name.split(' ').join('_');
        new_exercise(name,url,function(name){
            io.sockets.in("stab").emit('newExercise',name);
        });
    });
    socket.on('editExerciseUrl',function(name,url){ //admin
        console.log("name: "+name+" url: "+url);
        update_col("exercises","url",url,"exercise",name.split(' ').join('_'));
    });
    socket.on('createGroup',function(name,array){ //admin
        new_group(array,name,function(name){
            io.sockets.in("stab").emit('newGroup',name);
        });
    });
    socket.on('editGroupadd',function(name,user){ //admin
        console.log(name + "   " +user);
        push_group(user,name);
    });
    socket.on('editGroupdelete',function(name,user){ //admin
        console.log("user email: "+user.email+" group name: " +name);
        pop_group(user.email,name);//name = groupname
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
        console.log(name,cyclenum,cyclelen);
        create_fullworkout(cyclenum,cyclelen,name);
    });
    socket.on('createWorkout',function(full,array,date,cycle,day){ //admin 
        get_assigned_gro_1(full,[],function(list,a){
            console.log("can i get a list here?",list);
            kill1 = true;
            kill2 = true;
            kill3 = true;
            create_workout(array,date,cycle,day,full,list,function(workout){
            });
        })
    });
    socket.on('deleteWorkout',function(workout){ //admin
        delete_workout(workout);
    });
    socket.on('getFullWorkout',function(full){ //admin
        wo_in_full(full,function(list){
            console.log("get full workout request received", list)
            socket.emit('fullWorkout',list);
        });
    });
    socket.on('getUsersWorkouts', function(email) {
        get_all_them_workouts(email, function(email, list) {
            
            socket.emit('viewDataForUser', email, list);
        });
    });
    socket.on('getBlankWorkout',function(workout){ //admin
        table_to_array(workout,"email",function(array){socket.emit('blankWorkout',array);});
    });
    socket.on('createUser',function(name,email,status){ //admin
        new_user(name,email,status,function(obj){
            io.sockets.in("stab").emit('newUser',obj);
        });
    });
    socket.on('getGroupExerciseData',function(group){ //admin
        get_group_data(group,function(obj){
            socket.emit('groupExerciseData',obj);
        });
    });
    socket.on('getUserData',function(email){ //all
        console.log("user data request received");
        get_user_data(email,function(obj){
            console.log(obj);
            socket.emit('userData',obj);
        });
    });
});
var kill1;
var kill2;
var kill3;
function get_email(req,callback){
    var email = null;
    var domain = null;
    console.log("we're at get_email", "the digits are " + req);
    conn.query('SELECT email,status FROM backfill WHERE "digits"=($1)',[req])
    .on('data',function(row){
        email = row.email;
        domain = row.status;
    })
    .on('end',function(){
        callback(email,domain);
    })
    .on('error',function(){
        console.log("get_email has shit itself");
    })
}
function ensureAuthenticated(req, res, next) { //next runs the next function in the arguement line "app.get('/datapage', ensureAuthenticated, function(req, res)" would move to function(req, res)
        if (req.user || req.isAuthenticated()) {    // is the user logged in?
            // proceed normally
            console.log("we are ensured");
            return next();
        } else {                                    // user is not logged in
            console.log("we are not ensured");
            res.redirect('/auth/google');
        }
}
app.get('/', ensureAuthenticated, function(request, response){
    get_email(request.user,function(email,domain){
        get_next_wo(email,function(email,workout){
            console.log("email and workout",email,workout);
            get_all_false(email,workout,null,function(email,workout,array,allworkouts){
                console.log("allworkout",allworkouts);
                response.render('view_Workout.html',{email:email,workout:workout,allworkouts:allworkouts});/*mustahce in workout and allworkouts*/
            });
        });
    });
});
app.get('/login', function(request,reponse){
    reponse.render('Login.html');
});
app.get('/create', ensureAuthenticated, function(request,response){
    get_email(request.user,function(email,domain){
        if(domain == "admin"){
            get_all_groups(function(groups){
                get_all_full(groups,function(groups,workouts){
                    get_all_exercises(groups,workouts,function(groups,workouts,exercises){
                        get_all_users(groups,workouts,exercises,function(groups,workouts,exercises,users){
                            response.render('create_Workout.html',{groups:groups, workouts:workouts, exercises:exercises, users:users});
                        });
                    });
                });
            });
        }
        else{
            response.redirect('/');
        }
    });
});
/*
app.get('/progress', ensureAuthenticated, function(request, response){
    get_email(request.user,function(email,domain){
        console.log("get_email worked");
        get_user_data(email,function(data){
            console.log("get_user_data worked");
            get_all_exercises(data,null,function(groups,workouts,exercises){
                var data = groups;
                console.log("get_all_exercises worked");
                response.render('user-progress.html',{data:data,exercises:exercises});
            });
        });
    });
});
*/
server.listen(8080);
function getRealDate(number){
    var d = new Date(number);
    var date = d.toJSON().substring(0,10);
    return date; 
}
////////////////////////////////////////////////////////////USERS////////////////////////////////////////////////
function new_user(name,email,status,callback){
    conn.query('INSERT INTO users (name,email,status) VALUES ($1,$2,$3)',[name,email,status])
    .on('error',function(){
        console.log("new_user has shit itself");
    });
    var x =0;
    conn.query('CREATE TABLE "main"."'+email+'" ("workout" TEXT ,"completed" BOOL, "skipped" BOOL, "date" INTEGER)')
    .on('error',function(){
        x=1;
        console.log('user not created');
    });
    setTimeout(function(){
        var exercises = [];
        conn.query('SELECT exercise FROM exercises')
        .on('data',function(row){
            exercises.push(row.exercise.split('_').join(' '));
        })
        .on('end',function(){
            for(var i = 0;i<exercises.length;i++){
                conn.query('ALTER TABLE "main"."'+email+'" ADD '+exercises[i]+' FLOAT');
            }
            if(x==0){
                callback({name:name, email:email});
            }
            else{
                callback({name:null,email:null});
            }
        })
        .on('error',function(){
            console.log("new_user has shit itself part 2");
        });
    },1000);
}
function get_all_users(groups,workouts,exercises,callback){
    var users = [];
    conn.query('SELECT name,email FROM users')
    .on('data',function(row){
        var user = {name:row.name, email:row.email}
        users.push(user);
    })
    .on('error',function(){
        console.log("gat_all_users has shit itself");
    })
    .on('end',function(){
        callback(groups,workouts,exercises,users);
    });
}
function get_next_wo(email,callback){
    var date = new Date();
    console.log(date);
    var d= Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());
    var e= 172800000;
    var newest = d+1728000000;
    var workout = null;
    conn.query('SELECT workout,date FROM "main"."'+email+'" WHERE "completed" = ($1) AND "skipped" = ($2)',[false,false])
    .on('data',function(row){
        console.log(row.workout);
        console.log(row.date, "?1",(d-e) );
        console.log(row.date, "?2", newest);
        if(row.date < (d-e)){ //48 hours after it is assumed that workout has been skipped
            update_col(email,"skipped",true,"workout",row.workout);
        }
        else if(row.date < newest){
            console.log("yay workout isnt null");
            newest = row.date;
            workout = row.workout;
        }
    })
    .on('error',function(){
        console.log("get_next_wo has an error")
    })
    .on('end',function(){
        callback(email,workout);
    });
}
function get_all_false(email,workout,array,callback){
    console.log( "get all false bout to work", workout);
    if(workout == null){
        callback(email,workout,array,null);
    }
    else{
    var list = []
    console.log('at get_all_false', email);
    conn.query('SELECT workout,date FROM "main"."'+email+'" WHERE "completed"=($1)',[false])
    .on('data',function(row){
        var obj = new Object()
        obj.date = getRealDate(row.date);
        obj.workout = row.workout;
        if(workout != obj.workout){
            console.log("here is the obj",obj);
            list.push(obj);
        }
    })
    .on('error',function(){
        console.log("get_all_false has shit itself");
    })
    .on('end',function(){
        /*
    console.log("we at the end");
    var listy = list;
    for(var i=0;i<list.length;i++){
        console.log(list[i]);
        var f = list[i];
        var full = workout.slice(0,workout.indexOf("_"));
        conn.query('SELECT cycle,day FROM "main"."'+full+'" WHERE "workout"=($1)',[list[i].workout])
        .on('data',function(row){
            console.log(f)
            console.log(f.date);
            f.string = getRealDate(f.date)+ " Week:"+row.cycle.toString()+", Day:"+row.day.toString();
            listy[i].string = f.string;
        })
        .on('error',function(row){
            console.log("dont crash");
        })
        .on('end',function(){
            if(i == list.length-1){
                callback(email,workout,array,listy);
            }
            console.log("ready to go");
        });
    }
    */
    callback(email,workout,array,list);
    });
    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////EXERCISES/////////////////////////////////////////////
function get_all_exercises(groups,workouts,callback){
    var exercises = [];
    conn.query('SELECT exercise FROM exercises')
    .on('data',function(row){
        exercises.push({exercise:row.exercise.split('_').join(' ')});
    })
    .on('error',function(){
        console.log("get_all_exercises has shit itself");
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
    .on('error',function(){
        console.log("get_exercise_url has shit itself");
    })
    .on('end',function(){
        return url;
    });
}
function isLetter(str) {
  return str.length === 1 && str.match(/[a-z]/i);
}
function new_exercise(name,url,callback){
    var x=0;
    if(!name.charAt(0).match(/[a-zA-Z]/i)){
        name = "_"+name;
    }
    for(var i=0;i<name.length;i++){
        if(!name.charAt(i).match(/[a-zA-Z0-9]/i)){
            name = name.substring(0,i) + "_" + name.substring(i+1);
        }
    }
    conn.query('INSERT INTO exercises (exercise,url) VALUES ($1,$2)', [name,url]) //if the exercise does not exist already?
    .on('error', function(){
        x=1;
        console.log("new_exercise has shit itself");
    });
    setTimeout(function(){
        if(x==0){
            conn.query('ALTER TABLE users ADD '+name+' FLOAT');
            conn.query('SELECT email FROM users')
            .on('data',function(row){
                conn.query('ALTER TABLE "main"."'+row.email+'" ADD '+name+' FLOAT');
            });
            callback(name,url);
        }
    },1000);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////GROUPS///////////////////////////////////////////////
function new_group(array, name,callback){
    if(!name.charAt(0).match(/[a-zA-Z]/i)){
        name = "_"+name;
    }
    for(var i=0;i<name.length;i++){
        if(!name.charAt(i).match(/[a-zA-Z0-9]/i)){
            name = name.substring(0,i) + "_" + name.substring(i+1);
        }
    }
    var x=0;
    console.log('arrived at new group');
    conn.query('CREATE TABLE "main"."'+name+'" ("name" TEXT, "email" TEXT UNIQUE)')
    .on('error',function(){
        x=1;
        console.log("hopefully x will equal 1 here x=" + x);
    });
    setTimeout(function(){
        if(x==0){
            console.log("wehave a new group");
            conn.query('INSERT INTO groupsf (groupf) VALUES ($1)', [name]);
            for(var i =0;i<array.length;i++){
                conn.query('INSERT INTO "main"."'+name+'" (name,email) VALUES ($1,$2)',[array[i].name,array[i].email])
                .on('error',function(){
                    console.log("youse an idiot");
                });
            }
            conn.query('CREATE TABLE "main"."'+name+"_assigned"+'" ("full" TEXT)');
            callback(name);
        }
        else{
            callback(null);
        }
    },1000);
}
function assign_full_workout(group,full){
    console.log("ready to assign",group,full);
    get_assigned_gro_1(full,[group,full],function(assigned,list){
        console.log("were back ",assigned);
        var x =0;
        for(var i=0;i<assigned.length;i++){
            console.log(assigned[i], list[0]);
            if(assigned[i] == list[0]){
                var x=1;
                console.log("thats already assigned");
                break;
            }
        }
        if(x==0){
            console.log("this is not a repeat", list[1]+ "is the full", list[0]+ "is the group");
            console.log(list[1].toString());
            console.log(list[0].toString());
            conn.query('INSERT INTO "main"."'+list[1].toString() +"_groups"+'" (groupf) VALUES ($1)',[list[0]]);
            conn.query('INSERT INTO "main"."'+list[0].toString()+"_assigned"+'" (full) VALUES ($1)',[list[1]]);
            var date = new Date();
            var d = Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-172800000;
            console.log(d);
            conn.query('SELECT * FROM "main"."'+list[1]+'" WHERE "skip"=($1) AND "date">($2)',[false,d])
            .on('error', function(){
                console.log("assign full workout has shit itself");
            })
            .on('data',function(row){
                console.log("here we are ",row);
                table_to_array_2(row.workout,"email",list[0],row.date,function(array,workout,a,b){
                    populate_table_init(array,workout,a,b);
                });
            });
        }
    });
}
function unassign_workout(group,full){
    console.log(group,full);
    var str = full.toString() +"_groups";
    var str2 = group.toString()+"_assigned";
    conn.query('DELETE FROM "main"."'+str+'" WHERE "groupf"=($1)',[group]);
    conn.query('DELETE FROM "main"."'+str2+'" WHERE "full"=($1)',[full]);
    var w;
    var e;
    conn.query('SELECT workout FROM "main"."'+full+'" WHERE "skip"=($1)',[false])
    .on('data',function(row){
        w = row.workout;
        conn.query('SELECT email FROM "main"."'+w+'" WHERE "completed"=($1)',[false])
        .on('data',function(row){
            e = row.email;
            conn.query('DELETE FROM "main"."'+e+'" WHERE "workout"=($1) AND "completed"=($2)',[w,false])
            .on('end',function(){
                conn.query('DELETE FROM "main"."'+w+'" WHERE "workout"=($1) AND "completed"=($2)',[e,false])
            });
        });
    });
}
/*
function getGroupUsers(user,group){
    var date = new Date();
    var d = Date.UTC(date)-172800000;
    conn.query('INSERT INTO "main"."'+group+'" (name,email) VALUES ($1,$2)',[user.name,user.email]);
    conn.query('SELECT full FROM "main"."'+group.toString()+"_assigned"+'" ')
    .on('data',function(row){
        conn.query('SELECT workout FROM "main"."'+row.full+'" WHERE "completed"=($1), "date">($2)',[true,d])
        .on('data',function(row){
            table_to_array_2(row.workout,email,user.name,user.email,function(array,workout,a,b){
                var setnum = array.length;
                insert_wo_row(a,b,setnum,row.workout,array);
            });
        });
    });
}
*/
function push_group(user,group){
    console.log(user.email + "    "+ group);
    var date = new Date();
    var d = Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-172800000;
    var x =0;
    conn.query('INSERT INTO "main"."'+group+'" (name,email) VALUES ($1,$2)',[user.name,user.email])
    .on('error',function(){
        console.log("youse an idiot");
        x=1;
    });
    if(x==0){
        conn.query('SELECT full FROM "main"."'+group.toString()+"_assigned"+'" ')
        .on('data',function(row){
            console.log(row.full);
            conn.query('SELECT workout FROM "main"."'+row.full+'" WHERE "skip"=($1) AND "date">($2)',[false,d])
            .on('data',function(row){
                console.log(row.workout);
                table_to_array_2(row.workout,user.email,user.name,user.email,function(array,workout,a,b){
                    var setnum = array.length;
                    insert_wo_row(a,b,setnum,row.workout,array);
                });
            });
        });
    }
}
function pop_group(email,group){
    console.log("pop group");
    conn.query('DELETE FROM "main"."'+group+'" WHERE "email"=($1)',[email]);
    conn.query('SELECT full FROM "main"."'+group.toString()+"_assigned"+'" ')
    .on('data',function(row){
        conn.query('SELECT workout FROM "main"."'+row.full+'" WHERE "skip"=($1)',[false])
        .on('data',function(row){
            conn.query('DELETE FROM "main"."'+email+'" WHERE "workout"=($1) AND "completed"=($2)',[row.workout,false]);
            conn.query('DELETE FROM "main"."'+row.workout+'" WHERE "email"=($1) AND "completed"=($2)',[email,false]);
        });
    });
}
function get_all_groups(callback){
    var list = [];
    conn.query('SELECT groupf FROM groupsf')
    .on('data',function(row){
        list.push({group:row.groupf});
    })
    .on('error',function(){
        console.log("get_all_groups has shit itself");
    })
    .on('end',function(){
        callback(list);
    });
}
function get_group(group,callback){
    var list = [];
    conn.query('SELECT name,email FROM "main"."'+group+'"')
    .on('data',function(row){
        list.push(row);
    })
    .on('error',function(){
        console.log("get_group has shit itself");
    })
    .on('end',function(){
        callback(list);
    });
}
function get_assigned_gro(workout,callback){
    var list = [];
    conn.query('SELECT groupf FROM "main"."'+workout+ "_groups"+'"')
    .on('data',function(row){
        var group = row.groupf
        list.push(group);
    })
    .on('error',function(){
        console.log("get_assigned_gro has shit itself");
    })
    .on('end',function(){
        callback(list);
    });
}
function get_assigned_gro_1(workout,a,callback){
    var list = [];
    console.log(workout);
    conn.query('SELECT groupf FROM "main"."'+workout.toString()+ '_groups'+'"')
    .on('data',function(row){
        var group = row.groupf
        list.push(group);
    })
    .on('error',function(){
        console.log("get_assigned_gro_1 has shit itself");
    })
    .on('end',function(){
        console.log("get_assigned_gro_1 worked!");
        callback(list,a);
    });
}
function get_assigned_wo(group,callback){
    var list = [];
    console.log(group);
    conn.query('SELECT full FROM "main"."'+group+ '_assigned'+'"')
    .on('data',function(row){
        list.push(row);
    })
    .on('error',function(){
        console.log("get_assigned_wo has shit itself");
    })
    .on('end',function(){
        console.log("this is the list", list)
        var listy= [];
        for(var i=0;i<list.length;i++){
            var x = list[i].full;
            var y = parseInt(x.substring(1));
            conn.query('SELECT workout FROM workouts WHERE "ident"=($1)',[y])
            .on('data',function(row){
                row.full =x;
                listy.push(row);
            })
            .on('end',function(){
                callback(listy);
            })
        }
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////WORKOUT GENERATION//////////////////////////////////////
function create_fullworkout(cyclenum,cyclelen,name){
    if(!name.charAt(0).match(/[a-zA-Z]/i)){
        name = "_"+name;
    }
    for(var i=0;i<name.length;i++){
        if(!name.charAt(i).match(/[a-zA-Z0-9]/i)){
            name = name.substring(0,i) + "_" + name.substring(i+1);
        }
    }
    console.log("we made it to create_fullworkout");
    var x =1;
    conn.query('INSERT INTO workouts (cyclenum,cyclelen,workout) VALUES ($1,$2,$3)',[cyclenum,cyclelen,name])
    .on('error',function(){
        x =0;
        console.log("create_fullworkout has shit itself part 2");
    });
    setTimeout(function(){
        if(x==1){
            console.log('setTimeout worked');
            var full = 0;
            conn.query('SELECT * FROM workouts')
            .on('data',function(row){
                console.log(row);
            });
            conn.query('SELECT ident FROM workouts WHERE "workout"=($3)',[name])
            .on('data',function(row){
                console.log("\n",row);
                full = "a"+row.ident.toString();
                console.log(full + "is the full number");
                io.sockets.in("stab").emit("newFullWorkout", name, full);
            })
            .on('error',function(){
                console.log("create_fullworkout has shit itself");
            })
            .on('end', function(){
                if(full != 0){
                    console.log("at the end");
                    conn.query('CREATE TABLE "main"."'+full + "_groups"+'" ("groupf" TEXT)');
                    create_blank_full_workout(full,cyclenum,cyclelen);
                }
            });
        }
    },1000);
}
function create_blank_full_workout(full,cyclenum,cyclelen){
    console.log("fuck yes jesus");
    var x =0;
    console.log(full);
    conn.query('CREATE TABLE "'+full+'" ("cycle" INTEGER, "day" INTEGER, "workout" TEXT, "date" INTEGER, "skip" BOOL)')
    .on('error',function(){
        console.log("create_blank_full_workout has shit itself");
        x=1;
    });
    setTimeout(function(){
        if(x==0){
            console.log("no error");
            for(var i=0;i<cyclenum;i++){
                for(var j=0;j<cyclelen;j++){
                    console.log("insert",i,j)
                    conn.query('INSERT INTO "main"."'+full+'" (cycle,day,skip,date) VALUES ($1,$2,$3,$4)',[i+1,j+1,true,0]);
                }
            }
        }
    },1000);
}
function create_workout(array, date, cycle, day, full,list,callback){
    console.log(array,date,cycle,day,full,list);
    setTimeout(function(){
    console.log("do i make it up to create_wo_name")
    create_wo_name(array, date,cycle,day,full,list,function(array,date,cycle,day,full,workout,list,callback){
        setTimeout(function(){
        console.log("do i make it up to array_to_table_init");
        array_to_table_init(array,workout,date,cycle,day,full,list,function(array,workout,date,cycle,day,full,list){
            setTimeout(function(){
            console.log("do i make it up to populate_table_init_2");
            populate_table_init_2(array,workout,date,cycle,day,full,list,function(array,workout,date,cycle,day,full){
                setTimeout(function(){
                console.log("have i made it to the end", full,date,workout,cycle,day)
                conn.query('UPDATE "main"."'+full+'" SET "date"=($1),"skip"=($2),"workout"=($3) WHERE "cycle"=($4) AND "day"=($5)',[date,false,workout,cycle,day]);
                update_col(workout,"completed",true,"email","email");
                console.log("we made it");
                },6000);
            });
            },2000);
        });
        },2000);
    });
    },2000);
}
function create_wo_name(array, date,cycle,day,full,list,callback){
    if(kill2){
    console.log("create_wo_name called");
    var workout = full.toString()+'_'+(Math.floor(Math.random()*100000000)).toString();
    console.log(workout);
    kill2 = false;
    put_wo_in_db(array,date,cycle,day,full,workout,list,callback, function(array,date,cycle,day,full,workout,list,callback){
        console.log(workout, "we have a name");
        callback(array,date,cycle,day,full,workout,list,callback);  
    });
    }
    /*
    .on('error',function(){
        console.log("how the fuck");
        //create_wo_name(array, date,cycle,day,full,callback);//this is superflous we have synchrounousity problems 
    });
    */
}
function put_wo_in_db(array,date,cycle,day,full,workout,list,callback, clbck){
    if(kill3){
    console.log("heres where we put wo in db", workout);
    conn.query('CREATE TABLE "main"."'+workout+'" ("email" TEXT, "name" TEXT,"date" INTEGER, "completed" BOOL, "sets" INTEGER) ');
    clbck(array,date,cycle,day,full,workout,list,callback);
    kill3 = false;
    }
}
function populate_table_init(array,table,full,date){
    conn.query('SELECT groupf FROM "main"."'+full.toString() + "_groups"+'"')
    .on("data",function(row){
        conn.query('SELECT name,email FROM "main"."'+row.groupf+'"')
        .on('data',function(row){
            insert_wo_row(row.name,row.email,array.length,table,array,date);
        });
    })
    .on('error',function(){
        console.log("populate_table_init has shit itself");
    })
    .on('end', function(){
        insert_wo_row("name","email",array.length,table,array,date);
    });
}
function populate_table_init_2(array,table,date,cycle,day,full,list,callback){
    console.log("timetopopulate",list[0]);
    for(var i=0;i<list.length;i++){
        conn.query('SELECT name,email FROM "main"."'+list[i]+'"')
        .on('data',function(row){
            console.log("we callin on you", row.email);
            insert_wo_row(row.name,row.email,array.length,table,array,date);
        })
        .on('error',function(){
            console.log("why youse always failin populate_table_init_2");
        });
    }
    console.log("we have filled in the table");
    insert_wo_row("name","email",array.length,table,array,date);
    callback(array,table,date,cycle,day,full);
}
function insert_wo_row(name,email,setnum,table,array,date){
    console.log("this is called from populate_table_init_2");
    console.log("insert_wo_row ",name,email,setnum,table,array,date);
    var x =0;
    conn.query('SELECT email FROM "main"."'+table+'"')
    .on('data',function(row){
        if(row.email == email){
            var x =1;
        }
    })
    .on('error',function(){
        console.log("insert_wo_row has shit itself");
    })
    .on('end',function(){
        console.log("i'm assigning workout to email", table, email);
        if(x==0){
            conn.query('INSERT INTO "main"."'+table+'" (email,name,completed,sets,date) VALUES ($1,$2,$3,$4,$5)',[email,name,false,setnum,date])
            populate_table_full(array,table,setnum,email);
            if(email != "email"){
                conn.query('INSERT INTO "main"."'+email+'" (workout,completed,skipped,date) VALUES ($1,$2,$3,$4)',[table,false,false,date]);
            }
        }
    });
}
function delete_workout(workout){
    var full = workout.slice(0,workout.indexOf("_"));
    conn.query('UPDATE "main"."'+full+'" SET "completed"=($1) WHERE "workout"=($2)',[false,workout]);
    conn.query('DELETE FROM "main"."'+workout+'" WHERE "completed"=($1)',[false]);
    get_assigned_gro_1(full,workout,function(list,workout){
        for(var i=0;i<list.length;i++){
            get_group(list[i],function(list){
                for(var j=0;j<list.length;j++){
                    conn.query('DELETE FROM "main"."'+list2[j].email+'" WHERE "completed"=($1) AND "workout"=($2)',[false,workout]);
                }
            });
        }
    });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////DATA CONVERSION FUNCTIONS//////////////////////////////////////////////
function array_to_table_init(array,workout,date,cycle,day,full,list,callback){
    if(kill1){
    var setnum = array.length;
    console.log("the array is ", array);
    console.log("the setnum is ", setnum);
    console.log("the first thing in this is ", array[0]);
    var table = workout;
    for(var i=0;i<setnum;i++){
        console.log("here a");
        create_column(table,"b"+(i+1).toString(),"BOOL");
        console.log("here b");
        create_column(table,"b"+(i+1).toString() + "_length","INTEGER");
        console.log("here c");
        console.log("the exercise array is", array[i].exercises);
        for(var j=0;j<array[i].exercises.length;j++){
            console.log("here d");
            create_column(table,"b"+(i+1).toString() + "_" + (j+1).toString(),"BOOL");
            console.log("here e");
            create_column(table,"b"+(i+1).toString() + "_" + (j+1).toString() + "x" + array[i].exercises[j].name.split(' ').join('_'), "TEXT");
            console.log("here f");
            var rounds = array[i].exercises[j].rounds;
            console.log("the rounds are ", rounds);
            create_column(table,"b"+(i+1).toString() + "_" + (j+1).toString() + "_length","INTEGER");
            console.log("here g");
            for(var k=0;k<rounds.length;k++){
                console.log("here 1");
                create_column(table,"b"+(i+1).toString() + "_" + (j+1).toString() + "_"+ (k+1).toString(),"BOOL");
                console.log("here 2");
                create_column(table,"b"+(i+1).toString() + "_" + (j+1).toString() + "_"+ (k+1).toString()+"_reps","INTEGER");
                console.log("here 3");
                create_column(table,"b"+(i+1).toString() + "_" + (j+1).toString() + "_"+ (k+1).toString()+"_weight","INTEGER");
                console.log("here 4");

            }
        }
    }
    console.log("we initialized the table");
    kill1 = false; 
    callback(array,workout,date,cycle,day,full,list)
    }
}
function populate_table_full(array,table,setnum,email){
    console.log("we have arrived at populate_table_full");
    for(var i=0;i<setnum;i++){
        update_col(table,"b"+(i+1).toString(),true,"email",email);
        update_col(table,"b"+(i+1).toString()+ '_length',array[i].exercises.length,"email",email);
        for(var j=0;j<array[i].exercises.length;j++){
            update_col(table,"b"+(i+1).toString() +"_" +(j+1).toString(),true,"email",email);
            update_col(table,"b"+(i+1).toString() +"_" +(j+1).toString() + "x" + array[i].exercises[j].name.split(' ').join('_'),array[i].exercises[j].name.split(' ').join('_'),"email",email);
            update_col(table,"b"+(i+1).toString() +"_" +(j+1).toString() + "_length",array[i].exercises[j].rounds.length,"email",email);
            var reparray = []; //what the fuck is this???
            for(var k=0;k<array[i].exercises[j].rounds.length;k++){
                var r= array[i].exercises[j].rounds[k].reps;
                var w = 0;
                if(email != "email"){
                    w= rounder(get_weight(r,(get_old_max(email,array[i].exercises[j].name.split(' ').join('_')))),5);
                }
                update_col(table,"b"+(i+1).toString() +"_" +(j+1).toString() + "_"+ (k+1).toString()+"_weight",w,"email",email);
                update_col(table,"b"+(i+1).toString() +"_" +(j+1).toString() + "_"+ (k+1).toString(),true,"email",email);
                update_col(table,"b"+(i+1).toString() +"_" +(j+1).toString() + "_"+ (k+1).toString()+"_reps",r,"email",email);
            }
        }
    }
} 
function table_to_array(workout,email,callback){

    console.log("workout: "+workout+" email: "+email+" callbakc: "+callback);

    var array = [];
    console.log("query");
    conn.query('SELECT * FROM "main"."'+workout+'" WHERE "email"=($1)',[email])
    .on('data',function(row){
        var keys = [];
        for(var k in row){
            keys.push(k);
        }
        var sets = row.sets;
        for (var i = 1; i <= sets; i++) {
            var newset = new Object();
            newset.completed == true;
            var exercises = [];
            for(var j=1;j<=row[("b"+i.toString()+"_length")];j++){
                var newex = new Object();
                newex.completed = true;
                for(var k=0;k<keys.length;k++){
                    if(keys[k].slice(0,("b"+i.toString()+"_"+j.toString()+"x").length) == "b"+i.toString()+"_"+j.toString()+"x"){
                        newex.name = keys[k].slice(("b"+i.toString()+"_"+j.toString()+"x").length).split('_').join(' ');
                        break;
                    }
                }
                newex.rounds = [];
                for(var l=1;l<=row[("b"+i.toString()+"_"+j.toString()+"_length")];l++){
                    var round = new Object();
                    round.completed = true;
                    round.weight = row[("b"+i.toString()+"_"+j.toString()+"_"+l.toString() + "_weight")];
                    round.reps = row[("b"+i.toString()+"_"+j.toString()+"_"+l.toString() + "_reps")];
                    newex.rounds.push(round);
                }
                exercises.push(newex);
            }
            newset.exercises = exercises;
            array.push(newset);
        }
    })
    .on('error',function(){
        console.log("table_to_array has shit itself");
    })
    .on('end',function(){
        callback(array);
    });
}
function table_to_array_2(workout,email,a,b,callback){
    var array = [];
    conn.query('SELECT * FROM "main"."'+workout+'" WHERE "email"=($1)',[email])
    .on('data',function(row){
        var keys = Object.keys(row);
        var values = Object.values(row);
        var sets = row.sets;
        for (var i = 1; i <= sets; i++) {
            var newset = new Object();
            newset.completed == true;
            newset.exercises == [];
            for(var j=1;j<=values[keys.indexOf("b"+i.toString()+"_length")];j++){
                var newex = new Object();
                newex.completed = true;
                for(var k=0;k<keys.length;k++){
                    if(keys[k].slice(0,("b"+i.toString()+"_"+j.toString()+"x").length) == "b"+i.toString()+"_"+j.toString()+"x"){
                        newex.name = keys[k].slice(("b"+i.toString()+"_"+j.toString()+"x").length).split('_').join(' ');
                        break;
                    }
                }
                newex.rounds = {};
                for(var l=1;l<=values[keys.indexOf("b"+i.toString()+"_"+j.toString()+"_length")];l++){
                    var round = new Object();
                    round.completed = true;
                    round.weight = values[keys.indexOf("b"+i.toString()+"_"+j.toString()+"_"+l.toString() + "_weight")];
                    round.reps = values[keys.indexOf("b"+i.toString()+"_"+j.toString()+"_"+l.toString() + "_reps")];
                    newex.rounds.push(round);
                }
                newset.exercises.push(newex);
            }
            array.push(newset);
        }
    })
    .on('error',function(){
        console.log("table_to_array has shit itself");
    })
    .on('end',function(){
        callback(array,workout,a,b);
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////SUBMISSION FUNCTIONS////////////////////////////////////////////
function submit_workout(email,workout,date){
    conn.query('UPDATE "main"."'+workout+'" SET "completed"=($1),"date"=($2) WHERE "email"=($3)',[true,date,email]);
    conn.query('UPDATE "main"."'+email+'" SET "completed"=($1),"date"=($2) WHERE "workout"=($3)',[true,date,workout]);
    get_wo_val(workout, "sets",email,{},function(workout,column,email,list,val){
        for(var i=1;i<=val;i++){
            get_wo_val(workout,"b"+i.toString(),email,{},function(workout,column,email,list,val){
                if(val == true){
                    submit_set(email,workout,column);
                }
            });
        }
    });
}
function submit_set(email,workout,str){
    get_wo_val(workout,str+"_length",email,{},function(workout,column,email,list,val){
        for(var j=1;j<=val;j++){
            get_wo_val(workout,str+"_"+j.toString(),email,{},function(workout,column,email,list,val){
                if(val == true){
                    submit_ex(email,workout,column);
                }
            });
        }
    });
}
function unsubmit_set(email,workout,str){
    get_wo_val(workout,str+"_length",email,{},function(workout,column,email,list,val){
        for(var j=1;j<=val;j++){
            get_wo_val(workout,str+"_"+j.toString(),email,{},function(workout,column,email,list,val){
                if(val == true){
                    unsubmit_ex(email,workout,str+"_"+j.toString());
                }
            });
        }
    });
}
function unsubmmit_ex(email,workout,str){
    get_name_from_key(email,workout,str,function(email,workout,str,name){
        conn.query('UPDATE "main"."'+email+'" SET ' + name +  '= ($1) WHERE ($2) = ($3)',[null,"workout",workout])
        latest(email,workout,name,null,function(email,workout,name,max,bool){
            if(bool){
                other_latest(email,workout,name,function(email,name,max){
                    update_col("users",name,max,"email",email);
                    update_all_workouts(email,name);
                });
            }
        });
    });
}
function submmit_ex(email,workout,str){
    get_name_from_key(email,workout,str,function(email,workout,str,name){
        get_max_from_lift(email,workout,str,function(email,workout,str,val){
            if(val != NaN){
                conn.query('UPDATE "main"."'+email+'" SET ' + str +  '= ($1) WHERE ($2) = ($3)',[val,"workout",workout])
                latest(email,workout,str,val,function(email,workout,name,max,bool){
                    if(bool){
                        update_col("users",name,max,"email",email);
                        update_all_workouts(email,name);
                    }
                });
            }
        });
    });
}
function update_all_workouts(email,name){
    conn.query('SELECT workout FROM "main"."'+email+'" WHERE "completed"=($1) AND "skipped"=($2)',[false,false])
    .on('data',function(row){
        var wo = row.workout;
        conn.query('SELECT * FROM "main"."'+wo+'" WHERE "email"=($1)',[email])
        .on('data',function(row){
            var keys = Object.keys(row);
            var values = Object.values(row);
            var namelen = name.length;
            for(var k=0;k<keys.length;k++){
                if(keys[k].slice(-namelen) == name){
                    var col = keys[k];
                    var str1 = col.slice(0,col.length-namelen-1);
                     var strlen = str1 + "_1_reps";
                    get_wo_val(wo,strlen,email,[str1,name],function(workout,column,email,list,val){
                        var weightval = 0;
                        if(email != "email"){
                            weightval= rounder(get_weight(val,(get_old_max(email,list[1]))),5);
                        }
                        get_wo_val(workout,list[0]+'_length',email,[weightval,list[0]],function(workout,column,email,list,val){
                            for(var i=0;i<val;i++){
                                var x = i+1;
                                var y = 
                                conn.query('UPDATE "main"."'+workout+'" SET '+list[1]+"_"+x.toString()+"_weight"+'=($1) WHERE "email"=($2)',[list[0], email]);
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
    str = "b"+str;
    conn.query('UPDATE "main"."'+workout+'" SET ' + str +  '= ($1) WHERE ($2) = ($3)',[value,"email",user]);
    if(completed == true){
        var dashes = str.split("_").length-1;
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
            submit_ex(user,workout,(str.split("_")[0]+"_"+str.split("_")[1]));
        }
    }
}
function change_date(workout,date){
    var full = workout.split("_")[0];
    var groups = [];
    conn.query('SELECT groupf FROM "main"."'+workout+ "_groups"+'"')
    .on('data',function(row){
        groups.push(row);
    })
    .on('error',function(){
        console.log("change_date has shit itself");
    })
    .on('end',function(){
        var users =[];
        for(var i=0;i<groups.length();i++){
            var l = [];
            conn.query('SELECT name,email FROM "main"."'+groups[i]+'"')
            .on('data',function(row){
                l.push(row);
            })
            .on('end',function(){
                for(var j=0;j<l.length();j++){
                    users.push(l[j].email);
                    conn.query('SELECT date FROM "main"."'+l[j].email+'" WHERE "workout"=($1)',[workout])
                    .on('data',function(row){
                        if(row.date > date){
                            for(var i=0;i<users.length();i++){
                                conn.query('UPDATE "main"."'+users[i]+'" SET "date"=($1) WHERE "workout"=($2)',[date,workout]);
                            }
                        }
                        else if(row.date < date){
                            for(var i=0;i<users.length();i++){
                                conn.query('UPDATE "main"."'+users[i]+'" SET "date"=($1),"skipped"=($2) WHERE "workout"=($3)',[date,true,workout]);
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
    conn.query('SELECT workout,'+name+',date FROM "main"."'+email+'" WHERE "completed"=($1)',[true])
    .on('data',function(row){
        if(row.workout != workout && row.date > date){
            max = Object.values(row)[1];
            date = row.date;
        }
    })
    .on('error',function(){
        console.log("other_latest has shit itself");
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
    conn.query('SELECT workout,'+name+',date FROM "main"."'+email+'" WHERE completed=($1)',[true])
    .on('data',function(row){
        val = Object.values(row)[1];
        if(row.date > date && val != null){
            latest = row.workout;
            date = row.date;
        }
    })
    .on('error',function(){
        console.log("latest has shit itself");
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
    conn.query('SELECT '+column+' FROM "main"."'+workout+'" where "email"=($1)',[email])
    .on('error',function(){
        console.log("get_wo_val has shit itself");
    })
    .on('data',function(row){
        var val = Object.values(row)[0];
        callback(workout,column,email,list,val);
    });
}
function get_name_from_key(email,workout,str,callback){
    var s = str+"x";
    var len = s.length;
    var name;
    conn.query('SELECT * FROM "main"."'+workout+'" WHERE "email"=($1)',[email])
    .on('error',function(){
        console.log("get_name_from_key has shit itself");
    })
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
    conn.query('ALTER TABLE "main"."'+table+'" ADD '+column+' '+type+' ');
}
function update_col(table,column,value,cona,conb){
    conn.query('UPDATE "main"."'+table+'" SET ' + column +  '= ($1) WHERE "'+cona+'" = ($2)',[value,conb]);

    console.log(table +" "+column+" "+value+" "+cona+" "+conb);
}
function get_all_full(groups,callback){
    list = [];
    conn.query('SELECT workout,ident,cyclenum,cyclelen FROM workouts')
    .on('data',function(row){
        row.ident = "a"+row.ident.toString();
        list.push(row);
    })
    .on('error',function(){
        console.log("get_all_full has shit itself");
    })
    .on('end',function(){
        callback(groups,list);
    })
}
function wo_in_full(full,callback){
    list = [];
    console.log(full);
    conn.query('SELECT cycle,day,workout,skip FROM "main"."'+full+'"')
    .on('data',function(row){
        list.push(row);
    })
    .on('error',function(){
        console.log("wo_in_full has shit itself");
    })
    .on('end',function(){
        callback(list);
    });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////WEIGHTLIFTING MATH CALCULATIONS////////////////////////////
function get_max_from_lift(email,workout,str,callback){
    get_wo_val(workout,str+"_length",email,{str:str},function(workout,column,email,list,val){
        var total =0;
        var exlen = val;
        var value;
        for(var l=1;l<=exlen;l++){
            var rds = list.str+"_"+l.toString();
            total += get_wo_val(workout,rds + "_weight",email,{str:str},function(workout,column,email,list,val){
                return get_wo_val(workout,rds + "_reps",email,{str:str,weight:val},function(workout,column,email,list,val){
                    return get_new_max(val,list.weight);
                });
            });
        }
        value = Math.floor(total/exlen);
        callback(email,workout,list.str,value);
    });
}
function get_old_max(user, exercise){
    var weight =0;
    conn.query('SELECT '+exercise+' FROM users WHERE "email"=($1)',[user])
    .on('data',function(row){
        if(weight != null && weight != 0){
            weight = Object.values(row)[0];
        }
    })
    .on('error',function(){
        console.log("get_old_max has shit itself");
    })
    .on('end',function(){
        return weight;
    });
}
function get_new_max(reps,weight){
    return Math.floor((weight)/(1.013-(0.0267123*reps)));
}
function get_weight(reps,max){
    return ((1.013-(0.0267123*reps))*max);
}
function rounder(num,diff){
    return (Math.floor(((num+(diff/2))/diff))*diff)
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////Check Progress Data Grabber Functions////////////////////////////
function get_user_data(email,callback){
    array = [];
    console.log("email: "+email);
    conn.query('SELECT * FROM "main"."'+email+'" WHERE "completed"=($1) AND "skipped"=($2)',[true,false])
    .on('data',function(row){
        array.push(row);
    })
    .on('error',function(){
        console.log("get_user_data has shit itself");
    })
    .on('end',function(){
        var obj = {email:email, array:array};
        conn.query('SELECT name FROM users WHERE "email"=($1)',[email])
        .on('data',function(row){
            obj.name = row.name;
        })
        .on('end',function(){
            console.log(obj);
            callback(obj);
        });
    });
}

function get_all_them_workouts(email, callback){
    var array = [];
    conn.query('SELECT * FROM [' + email + ']').on('data', function(row){
        array.push(row);
    }).on('end', function(){
        callback(email, array);
    });
}
function get_group_data(group){
    get_group(group,function(list){
        var array = [];
        for(var i=0;i<list.length;i++){
            array.push(get_user_data(list[i].email,function(obj){}))
        }
        callback({groupname:group, data:array});
    });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////