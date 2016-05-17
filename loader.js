var anyDB = require('any-db');

var conn = anyDB.createConnection('sqlite3://weightroom.db.sqlite');

conn.query('CREATE  TABLE "main"."groups" ("ident" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "group" TEXT UNIQUE)');
conn.query('CREATE  TABLE "main"."exercises" ("exercise" TEXT UNIQUE , "url" TEXT)');
conn.query('CREATE  TABLE "main"."users" ("name" TEXT, "email" TEXT UNIQUE , "Bench_Press" 	INTEGER, "Military_Press" INTEGER, "Front_Squat" INTEGER, "Back_Squat" INTEGER, "Hang_Clean" INTEGER, "Deadlift" INTEGER, "RDL" INTEGER)');
conn.query('CREATE  TABLE "main"."backfill" ("email TEXT UNIQUE , "digits" INTEGER UNIQUE)');
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Bench_Press"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Military_Press"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Front_Squat"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Back_Squat"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Hang_Clean"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["Deadlift"]);
conn.query('INSERT INTO exercises (exercise) VALUES ($1)', ["RDL"]);
conn.query('CREATE  TABLE "main"."workouts" ("full_workout" TEXT, "ident" INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , "cyclenum" INTEGER, "cyclelen" INTEGER)');