var anyDB = require('any-db');

var conn = anyDB.createConnection('sqlite3://lift.db.sqlite');

conn.query('CREATE  TABLE "main"."groupsf" ("groupf" TEXT UNIQUE)');
conn.query('CREATE  TABLE "main"."exercises" ("exercise" TEXT UNIQUE , "url" TEXT)');
conn.query('CREATE  TABLE "main"."users" ("name" TEXT, "email" TEXT UNIQUE , "Bench_Press" 	INTEGER, "Military_Press" INTEGER, "Front_Squat" INTEGER, "Back_Squat" INTEGER, "Hang_Clean" INTEGER, "Deadlift" INTEGER, "RDL" INTEGER)');
conn.query('CREATE  TABLE "main"."backfill" ("email" TEXT UNIQUE , "digits" INTEGER UNIQUE)');
conn.query('CREATE  TABLE "main"."workouts" ("full_workout" TEXT UNIQUE, "ident" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "cyclenum" INTEGER, "cyclelen" INTEGER)');
//Helpful starting data
console.log("were here");

conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Bench_Press"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Military_Press"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Front_Squat"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Back_Squat"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Hang_Clean"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Deadlift"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["RDL"]);

conn.query('CREATE TABLE "main"."Rearden_Steel" ("name" TEXT, "email" TEXT UNIQUE)');
conn.query('CREATE TABLE "main"."Rearden_Steel-assigned" ("full" TEXT)');


conn.query('INSERT INTO Rearden_Steel (name,email) VALUES ($1,$2)',["Will Define","wdefine@students.stab.org"]);
conn.query('INSERT INTO Rearden_Steel (name,email) VALUES ($1,$2)',["Scott Williams","swilliams@students.stab.org"]);
conn.query('INSERT INTO Rearden_Steel (name,email) VALUES ($1,$2)',["Andy Wood","awood@students.stab.org"]);

conn.query('INSERT INTO users (name,email) VALUES ($1,$2)',["Will Define","wdefine@students.stab.org"]);
conn.query('INSERT INTO users (name,email) VALUES ($1,$2)',["Scott Williams","swilliams@students.stab.org"]);
conn.query('INSERT INTO users (name,email) VALUES ($1,$2)',["Andy Wood","awood@students.stab.org"]);

conn.query('CREATE  TABLE IF NOT EXISTS "wdefine@students.stab.org" ("workout" TEXT ,"completed" BOOL, "skipped" BOOL, "date" INTEGER)');
conn.query('CREATE  TABLE IF NOT EXISTS "swilliams@students.stab.org" ("workout" TEXT ,"completed" BOOL, "skipped" BOOL, "date" INTEGER)');
conn.query('CREATE  TABLE IF NOT EXISTS "awood@students.stab.org" ("workout" TEXT ,"completed" BOOL, "skipped" BOOL, "date" INTEGER)');

var exercises = [];
conn.query('SELECT exercise FROM exercises')
.on('data',function(row){
    exercises.push(row.exercise);
})
.on('end',function(){
    for(var i = 0;i<exercises.length;i++){
        conn.query('ALTER TABLE "wdefine@students.stab.org" ADD '+exercises[i]+' FLOAT');
        conn.query('ALTER TABLE "swilliams@students.stab.org" ADD '+exercises[i]+' FLOAT');
        conn.query('ALTER TABLE "awood@students.stab.org" ADD '+exercises[i]+' FLOAT');
    }
});

conn.query('INSERT INTO groupsf (groupf) VALUES ($1)',["Rearden_Steel"]);