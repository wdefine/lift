/*TODO LIST
1. fill in socket data!!!
2. make editing workout possible!
3. start writing mustahce files!
4. Figure out who is making get request!!! -something with ensureAuthenticted?
5. Make sure exercise/group/user does not exist before making it!!
6. On get data for graph requests,organize data/get rid of nulls!!
7. Make asynchronous adjustments!!!
8. Write change date function!!
9. Write function for skipping past workouts at the end of every day!!!
10. Make all incoming socket info hack proof!!
11. Write error functions on conn calls!!!
12. Make outgoing dates real!
13. Standardize order of variables into functions!
14. Write Delete workout function!!!
15. Finish check progress data grabber functions!!!
*/


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
            console.log(profile); //profile contains all the personal data returned 

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
        table_to_array(workout,email)
    });
    socket.on('getGroupWorkouts',function(group){ //admin
        get_assigned_wo(group);
    });
    socket.on('getWorkoutGroups',function(workout){ //admin
        get_assigned_gro(workout);
    });
    socket.on('getGroupUsers',function(group){ //admin
        get_group(group);
    });
    socket.on('submitMax',function(email,exercise,max){ //all
        update_col("users",encrypt(exercise),max,"email",email);
    });
    socket.on('changeWorkout',function(email,workout,set,exercise,type,value,completed){ //all
        var str = set.toString()+"-"+exercise.toString()+"-"+type;
        update_workout(str,value,completed,email,workout);
    });
    socket.on('submitWorkout',function(email,workout,date){ //all
        submit_workout(email,workout,date);
    });
    socket.on('createExercise',function(name,url){ //admin
        new_exercise(name,url);
    });
    socket.on('editExerciseUrl',function(name,url){ //admin
        update_col("exercises","url",url,"name",encrypt(name));
    });
    socket.on('createGroup',function(name,array){ //admin
        new_group(array,name);
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
        //must write this function see todo above
    });
    socket.on('createFullWorkout',function(name,cyclenum,cyclelen){ //admin
        create_fullworkout(cyclenum,cyclelen,name);
    });
    socket.on('createWorkout',function(workout,array,date,cycle,day){ //admin
        var full = workout.split("-")[0];
        create_workout(array,date,cycle,day,full)
    });
    socket.on('deleteWorkout',function(workout){ //admin
        //must write this function see todo above
    });
    socket.on('getBlankWorkout'function(workout){ //admin
        table_to_array(workout,"email");
    });
    socket.on('createUser',function(name,email){ //admin
        new_user(name,email);
    });
    socket.on('getGroupExerciseData',function(group){ //admin
        get_group_data(group);
    });
    socket.on('getUserData',function(email){ //all
        get_user_data(email);
    });
});

function ensureAuthenticated(req, res, next) { //next runs the next function in the arguement line "app.get('/datapage', ensureAuthenticated, function(req, res)" would move to function(req, res)
        if (req.user || req.isAuthenticated()) {    // is the user logged in?
            // proceed normally
            return next();
        } else {                                    // user is not logged in
            res.redirect('/auth/google');
        }
}
app.get('/', function(request, response){//
    //how do i get email from user? post request where email is grabbed from cookie? can i do this on server?
    var email = ???;
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
    var email = ???;
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
function convert_column(set,ex,rd,tag){
    var str ="";
    str+=set.toString();
    if(ex !=null){
        str+="-"+ex.toString();
    }
    if(rd!=null){
        str+="-"+rd.toString();
    }
    if(tag!=null){
        if(tag == "reps"){
            str+="-reps";
        }
        else if(tag == "weight"){
            str+="-weight";
        }
    }
    return str;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////USERS////////////////////////////////////////////////
function new_user(name,email){
    conn.query('INSERT INTO users (name,email) VALUES ($1,$2)',[name,email]);
    conn.query('CREATE  TABLE ($1) ("workout" TEXT ,"completed" BOOL, "skipped" BOOL, "date" INTEGER)', [email]);
    var exercises = get_all_exercises();
    for(var i = 0;i<exercises.length;i++){
        conn.query('ALTER TABLE ($1) ADD '+exercises[0]+' FLOAT',[email]);
    }
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
    var newdate = 100000000000000000;
    var workout = null;
    conn.query('SELECT workout,date FROM ($1) WHERE "completed"=($2),"skipped"=($3) "date">($4)',[email,false,false,date])
    .on('data',function(row){
        if(row.date< newdate){
            row.date = newdate;
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
    name = encrypt(name)
    conn.query('INSERT INTO exercises (exercise,url) VALUES ($1,$2)', [name,url]) //if the exercise does not exist already?
    .on('error', function(){
        return false;
    });
    conn.query('ALTER TABLE users ADD '+name+' FLOAT');
    var users = getUserList();
    for(var i=0;i<users.length;i++){
        conn.query('ALTER TABLE ($1) ADD '+name' FLOAT', [users[0].email]);
    }
    return true;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////GROUPS///////////////////////////////////////////////
function new_group(array, name){
    conn.query('CREATE TABLE IF NOT EXISTS ($1) ("name" TEXT, "email" TEXT)',[name])
    .on('error',function(){
        return false;
    })
    .on('end',function(){
        conn.query('INSERT INTO groups (group) VALUES ($1)', [name])
        .on('end',function(){
            for(var i =0;i<array.length;i++){
                conn.query('INSERT INTO ($1) (name,email) VALUES ($2,$3)',[name,array[i].name,array[i].email]);
            }
            var str = name+"-assigned";
            conn.query('CREATE TABLE ($1) ("full" TEXT)',[str])
            .on('end',function(){
                return true;
            });
        });
    });
}
function assign_full_workout(group,full){
    var str = full.toString() +"-groups";
    var str2 = group.toString()+"-assigned";
    //////////////////////////////////////////////////////////////////get date
    conn.query('INSERT INTO ($1) (group) VALUES ($2)',[str,group]);
    conn.query('INSERT INTO ($1) (full) VALUES ($2)',[str2,full]);
    conn.query('SELECT workout FROM ($1) WHERE "completed"=($2), "date">($3)',[full,true,date])
    .on('data',function(row){
        var array = table_to_array(row.workout,"email");
        populate_table_init(array,row.workout,full);
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
    conn.query('INSERT INTO ($1) (name,email) VALUES ($2,$3)',[group,user.name,user.email]);
    var ass = group.toString()+"-assigned";
    ///////////////////////////////////////////////get todays date
    conn.query('SELECT full FROM ($1)',[ass])
    .on('data',function(row){
        conn.query('SELECT workout FROM ($1) WHERE "completed"=($2), "date">($3)',[row.full,true,date])
        .on('data',function(row){
            var array = table_to_array(row.workout,email);
            var setnum = array.length;
            insert_wo_row(user.name,user.email,setnum,row.workout,array);
        });
    });
}
function pop_group(email,group){
    conn.query('DELETE FROM ($1) WHERE "email"=($2)',[group,email]);
    var assigned = group.toString()+"-assigned";
    conn.query('SELECT full FROM ($1)',[assigned])
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
    var str = workout+ "-groups";
    conn.query('SELECT group FROM ($1)',[str])
    .on('data',function(row){
        list.push(row);
    })
    .on('end',function(){
        return list;
    });
}
function get_assigned_wo(group){
    var list = [];
    var str = group+ "-assigned";
    conn.query('SELECT workout FROM ($1)',[str])
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
            create_fullworkout_group_table(full);
            create_blank_full_workout(full,cyclenum,cyclelen)
        });
    });
}
function create_fullworkout_group_table(full){
    var str= full.toString();
    var str+= "-groups";
    conn.query('CREATE TABLE ($1) ("group" TEXT)',[str]);
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
    var workout = build_workout(array,full,date);
    conn.query('UPDATE ($1) SET date=($2),skip=($3),workout=($4) WHERE "cycle"=($5),"day"=($6)',[full,date,false,workout,cycle,day]);
}
function build_workout(array, full,date){
    var rn=Math.floor(Math.random()*100000000)
    var workout_name = full.toString()+'-'+rn.toString();
    conn.query('CREATE TABLE IF NOT EXISTS ($1) ("email" TEXT, "name" TEXT,"date" INTEGER, "completed" BOOL, "sets" INTEGER) ', [workout_name])
    .on('error',function(){
        build_workout(array);
    })
    .on('end',function(){
        array_to_table_init(array,workout_name,full)
        return workout_name;
    });
}
function populate_table_init(array,table,full,date){
    var setnum = array.length;
    var groupstable = full.toString() + "-groups";
        conn.query('SELECT group FROM ($1)',[groupstable])
        .on("data",function(row){
            conn.query('SELECT name,email FROM ($1)',[row.group])
            .on('data',function(row){
                insert_wo_row(row.name,row.email,setnum,table,array,date);
            });
        });
        insert_wo_row("name","email",setnum,table,array,date);
}
function insert_user_row_init(email,workout,date){
    conn.query('INSERT INTO ($1) (workout,completed,skipped,date) VALUES ($2,$3,$4)',[email,workout,false,false,date])
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
                insert_user_row_init(email,table,date);
            }
        });
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
    populate_table_init(array, table,full);
}
function populate_table_full(array,table,setnum,email){
    for(var i=0;i<setnum;i++){
        var set = i+1;
        var setstr = set.toString();
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
        for (var i = 0; i < sets; i++) {
            var set =i+1;
            var exlenstr=set.toString()+"-length"; 
            var exlen = values[keys.indexOf(exlenstr)];
            var newset = new Object();
            newset[set] == false;
            newset.exercises == {};
            for(var j=0;j<exlen;j++){
                var ex = j+1;
                var exstr = set.toString()+"-"+ex.toString();
                var rdlenstr = exstr+"-length";
                var rdlen = values[keys.indexOf(rdlenstr)];
                var newex = new Object();
                newex[ex] = true;
                var name = decrypt(get_name_from_key(email,workout,extstr));
                newex.rounds = {};
                for(var l=0;l<rdlen;l++){
                    var rd = l+1;
                    var round = new Object();
                    round[rd] = true;
                    var rdstr = exstr+"-"+rd.toString();
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
    //var full = workout.slice(0, workout.indexOf("-"));
    conn.query('UPDATE ($1) SET completed=($2),date=($3) WHERE "email"=($4)',[workout,true,date,email]);
    conn.query('UPDATE ($1) SET completed=($2),date=($3) WHERE "workout"=($4)',[email,true,date,workout])
    .on('end',function(){
        var sets = get_wo_val(workout, "sets",email);
        for(var i=0;i<sets;i++){
            var thisset = i+1;
            var thissetstr = thisset.toString();
            if(get_wo_val(workout,thissetstr,email)==true){
                submit_set(email,workout,thissetstr);
            }
        }
    });
}
function submit_set(email,workout,str){
    var thissetlenstr = str+"-length";
    var exs = get_wo_val(workout,thissetlenstr,email);
    for(var j=0;j<exs;j++){
        var thisex = j+1;
        var thisexstr = str+"-"+thisex.toString();
        if(get_wo_val(workout,thisexstr,email)==true){
            submit_ex(email,workout,thisexstr);
        }
    }
}
function unsubmit_set(email,workout,str){
    var thissetlenstr = str+"-length";
    var exs = get_wo_val(workout,thissetlenstr,email);
    for(var j=0;j<exs;j++){
        var thisex = j+1;
        var thisexstr = str+"-"+thisex.toString();
        if(get_wo_val(workout,thisexstr,email)==true){
            unsubmit_ex(email,workout,thisexstr);
        }
    }
}
function unsubmmit_ex(email,workout,str){
    var exname = get_name_from_key(email,workout,str);
    update_col(email,exname,null,"workout",workout);
    if(latest(email,workout,exname) == true){
        var max = other_latest(email,workout,exname);
        update_col("users",exname,max,"email",email);
        update_col(email,exname,null,"workout",workout);
    }
}
function submmit_ex(email,workout,str){
    var exname = get_name_from_key(email,workout,str);
    var max= get_max_from_lift(email,workout,str);
    if(max != NaN){
        update_col(email,exname,max,"workout",workout);
        if(latest(email,workout,exname) == true){
            update_col("users",exname,max,"email",email);
            update_col(email,exname,max,"workout",workout);
        }
    }
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////WEIGHTLIFTING MATH CALCULATIONS////////////////////////////
function get_max_from_lift(email,workout,str){
    var thisexlenstr = str+"-length";
    var exlen = get_wo_val(workout,thisexlenstr,email);
    var total=0;
    for(var l=0;l<exlen;l++){
        var rd = l+1;
        var rds = str+"-"+thisr.toString();
        var ws = rds + "-weight";
        var rs = rds + "-reps";
        var w = get_wo_val(workout,ws,email);
        var r = get_wo_val(workout,rs,email);
        total += get_new_max(r,w);
    }
    return math.floor(total/exlen);
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
function get_user_date(email){

}
function get_group_data(group){

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////